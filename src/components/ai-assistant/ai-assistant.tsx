'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mic, MicOff, Loader2, Send, X, Bot, Search,
  ChevronRight, ExternalLink, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetClose, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { createFeeding } from '@/actions/feeding/create-feeding'
import { searchAnimals, type AnimalSearchResult } from '@/actions/animals/search-animals'
import { getAllAnimalIds } from '@/actions/animals/get-all-animal-ids'
import { FoodType } from '@prisma/client'

// ─── 타입 ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  text: string
  animalResults?: AnimalSearchResult[]
  navAction?: { label: string; url: string }
  confirmAction?: PendingAction
}

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PendingAction {
  type: 'CREATE_FEEDING'
  payload: {
    foodType: FoodType
    feedingDate: string
    quantity?: string | null
    memo?: string | null
    superfood?: boolean
  }
}

type VoiceState = 'idle' | 'recording' | 'processing'

const SILENCE_THRESHOLD = 0.01
const SILENCE_DURATION = 1500

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────
interface AiAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiAssistant({ open, onOpenChange }: AiAssistantProps) {
  const router = useRouter()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([])
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [isSendingText, setIsSendingText] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const msgCounterRef = useRef(0)
  const nextId = () => `ai-${++msgCounterRef.current}`

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const voiceStateRef = useRef<VoiceState>('idle')
  const isMicMutedRef = useRef(false)
  const isProcessingRef = useRef(false)
  const hasInitRef = useRef(false)
  const apiMessagesRef = useRef<ApiMessage[]>([])
  const selectedAnimalRef = useRef<AnimalSearchResult | null>(null)
  const pendingActionRef = useRef<PendingAction | null>(null)

  useEffect(() => { voiceStateRef.current = voiceState }, [voiceState])
  useEffect(() => { isMicMutedRef.current = isMicMuted }, [isMicMuted])
  useEffect(() => { apiMessagesRef.current = apiMessages }, [apiMessages])
  useEffect(() => { selectedAnimalRef.current = selectedAnimal }, [selectedAnimal])
  useEffect(() => { pendingActionRef.current = pendingAction }, [pendingAction])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Sheet 열릴 때 초기화 ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    if (hasInitRef.current) return
    hasInitRef.current = true

    const greeting: ChatMessage = {
      id: nextId(),
      role: 'bot',
      text: '안녕하세요! 무엇을 도와드릴까요?\n\n궁금한 기능을 물어보거나, "레오 귀뚜라미 줬어"처럼 기록하고 싶은 내용을 말씀해주세요.',
    }
    setMessages([greeting])
    setApiMessages([{ role: 'assistant', content: greeting.text }])
    startRecording()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sheet 닫힐 때 정리 ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      cleanup()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const cleanup = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close()
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
  }

  // ─── 메시지 ──────────────────────────────────────────────────────────────
  const addBotMessage = (msg: Omit<ChatMessage, 'id' | 'role'>) => {
    const full: ChatMessage = { id: nextId(), role: 'bot', ...msg }
    setMessages(prev => [...prev, full])
    setApiMessages(prev => [...prev, { role: 'assistant', content: msg.text }])
  }

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: nextId(), role: 'user', text }])
  }

  // ─── AI 호출 ──────────────────────────────────────────────────────────────
  const callAssistant = async (userText: string) => {
    const newApiMessages: ApiMessage[] = [
      ...apiMessagesRef.current,
      { role: 'user', content: userText },
    ]
    setApiMessages(newApiMessages)

    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newApiMessages,
        selectedAnimal: selectedAnimalRef.current,
      }),
    })
    return res.json()
  }

  // ─── AI 응답 처리 ─────────────────────────────────────────────────────────
  const handleAssistantResponse = async (ai: {
    message: string
    intent: string
    action: null | {
      type: string
      payload: Record<string, unknown>
    }
  }) => {
    const { message, action } = ai

    if (!action) {
      addBotMessage({ text: message })
      setVoiceState('idle')
      startRecording()
      return
    }

    switch (action.type) {
      case 'SEARCH_ANIMAL': {
        const query = (action.payload.animalQuery as string) || ''
        setIsSearching(true)
        addBotMessage({ text: message })
        const res = await searchAnimals(query)
        setIsSearching(false)
        if (res.success && res.data && res.data.length > 0) {
          setMessages(prev => {
            const last = prev[prev.length - 1]
            return [...prev.slice(0, -1), { ...last, animalResults: res.data }]
          })
        } else {
          addBotMessage({ text: `"${query}"라는 개체를 찾지 못했어요. 다른 이름으로 검색해볼까요?` })
        }
        startRecording()
        break
      }

      case 'CREATE_FEEDING': {
        const p = action.payload as PendingAction['payload']
        if (selectedAnimalRef.current) {
          // 개체 있으면 바로 등록
          await executeFeedingCreate(selectedAnimalRef.current, p, message)
        } else {
          // 개체 선택 필요
          setPendingAction({ type: 'CREATE_FEEDING', payload: p })
          pendingActionRef.current = { type: 'CREATE_FEEDING', payload: p }
          addBotMessage({ text: message + '\n\n어떤 개체인지 알려주시겠어요?' })
          startRecording()
        }
        break
      }

      case 'CREATE_FEEDING_ALL': {
        const p = action.payload as PendingAction['payload'] & { gender?: 'MALE' | 'FEMALE' | 'UNKNOWN' }
        const genderLabel = p.gender === 'MALE' ? '수컷' : p.gender === 'FEMALE' ? '암컷' : p.gender === 'UNKNOWN' ? '미구분' : '전체'
        setVoiceState('processing')
        addBotMessage({ text: message })
        const allIds = await getAllAnimalIds(p.gender)
        if (!allIds.success || !allIds.data?.length) {
          addBotMessage({ text: `${genderLabel} 개체가 없어요.` })
          setVoiceState('idle')
          startRecording()
          break
        }
        const result = await createFeeding({
          animalIds: allIds.data,
          foodType: p.foodType as FoodType,
          feedingDate: new Date(p.feedingDate),
          quantity: p.quantity ?? null,
          memo: p.memo ?? null,
          superfood: p.superfood ?? false,
        })
        setVoiceState('idle')
        if (result.success) {
          addBotMessage({ text: `${genderLabel} ${allIds.count}마리 피딩 기록이 저장됐어요!` })
        } else {
          addBotMessage({ text: `피딩 기록 중 오류가 발생했어요. (${result.error ?? '알 수 없는 오류'})` })
        }
        startRecording()
        break
      }

      case 'CREATE_FEEDING_EXCLUDE': {
        const p = action.payload as PendingAction['payload'] & {
          gender?: 'MALE' | 'FEMALE' | 'UNKNOWN'
          excludeNames: string[]
        }
        const genderLabel = p.gender === 'MALE' ? '수컷' : p.gender === 'FEMALE' ? '암컷' : p.gender === 'UNKNOWN' ? '미구분' : '전체'
        setVoiceState('processing')
        addBotMessage({ text: message })

        // 전체 ID 조회
        const allIds = await getAllAnimalIds(p.gender)
        if (!allIds.success || !allIds.data?.length) {
          addBotMessage({ text: `${genderLabel} 개체가 없어요.` })
          setVoiceState('idle'); startRecording(); break
        }

        // 제외할 개체 검색 (이름마다 검색 후 ID 수집)
        const excludeIdSet = new Set<string>()
        const foundNames: string[] = []
        const notFoundNames: string[] = []
        for (const name of p.excludeNames) {
          const res = await searchAnimals(name)
          if (res.success && res.data?.length) {
            res.data.forEach(a => excludeIdSet.add(a.id))
            foundNames.push(res.data[0].name || name)
          } else {
            notFoundNames.push(name)
          }
        }

        // 제외 후 피딩
        const targetIds = allIds.data.filter(id => !excludeIdSet.has(id))
        if (!targetIds.length) {
          addBotMessage({ text: '제외하고 나면 피딩할 개체가 없어요.' })
          setVoiceState('idle'); startRecording(); break
        }

        const result = await createFeeding({
          animalIds: targetIds,
          foodType: p.foodType as FoodType,
          feedingDate: new Date(p.feedingDate),
          quantity: p.quantity ?? null,
          memo: p.memo ?? null,
          superfood: p.superfood ?? false,
        })
        setVoiceState('idle')

        if (result.success) {
          const excludeNote = foundNames.length ? ` (${foundNames.join(', ')} 제외)` : ''
          const notFoundNote = notFoundNames.length ? `\n"${notFoundNames.join('", "')}"는 찾지 못해서 제외되지 않았어요.` : ''
          addBotMessage({ text: `${genderLabel} ${targetIds.length}마리 피딩 기록이 저장됐어요!${excludeNote}${notFoundNote}` })
        } else {
          addBotMessage({ text: `피딩 기록 중 오류가 발생했어요. (${result.error ?? '알 수 없는 오류'})` })
        }
        startRecording()
        break
      }

      case 'NAVIGATE': {
        const url = action.payload.url as string
        const label = navLabel(url)
        addBotMessage({
          text: message,
          navAction: { label, url },
        })
        startRecording()
        break
      }

      case 'OPEN_REGISTER': {
        addBotMessage({
          text: message,
          navAction: { label: 'AI 개체 등록 열기', url: '/animals/voice-register' },
        })
        startRecording()
        break
      }

      default:
        addBotMessage({ text: message })
        setVoiceState('idle')
        startRecording()
    }
  }

  const executeFeedingCreate = async (
    animal: AnimalSearchResult,
    p: PendingAction['payload'],
    botMsg: string
  ) => {
    setVoiceState('processing')
    const result = await createFeeding({
      animalIds: [animal.id],
      foodType: p.foodType as FoodType,
      feedingDate: new Date(p.feedingDate),
      quantity: p.quantity ?? null,
      memo: p.memo ?? null,
      superfood: p.superfood ?? false,
    })
    setVoiceState('idle')
    setPendingAction(null)
    pendingActionRef.current = null

    if (result.success) {
      addBotMessage({ text: `${animal.name || animal.uniqueId}의 피딩 기록이 저장됐어요!` })
    } else {
      addBotMessage({ text: `피딩 기록 중 오류가 발생했어요. (${result.error ?? '알 수 없는 오류'})` })
    }
    startRecording()
  }

  // ─── 개체 선택 ────────────────────────────────────────────────────────────
  const handleSelectAnimal = async (animal: AnimalSearchResult) => {
    setSelectedAnimal(animal)
    selectedAnimalRef.current = animal

    // 메시지에서 animalResults 제거
    setMessages(prev => prev.map(m => ({ ...m, animalResults: undefined })))

    const confirmMsg = `${animal.name || animal.uniqueId}${animal.speciesName ? ' (' + animal.speciesName + ')' : ''}를 선택했어요.`
    addUserMessage(confirmMsg)

    const pending = pendingActionRef.current
    if (pending?.type === 'CREATE_FEEDING') {
      await executeFeedingCreate(animal, pending.payload, '')
    } else {
      // AI에게 선택 알림
      setVoiceState('processing')
      voiceStateRef.current = 'processing'
      isProcessingRef.current = true
      try {
        const ai = await callAssistant(`사용자가 개체 "${animal.name || animal.uniqueId}"을 선택했습니다. 이어서 도와주세요.`)
        await handleAssistantResponse(ai)
      } finally {
        isProcessingRef.current = false
        setVoiceState('idle')
      }
    }
  }

  // ─── 텍스트 전송 ──────────────────────────────────────────────────────────
  const handleTextSend = async () => {
    const text = textInput.trim()
    if (!text || isSendingText || voiceState === 'processing') return

    setTextInput('')
    setIsSendingText(true)
    isProcessingRef.current = true

    if (voiceStateRef.current === 'recording') {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }

    addUserMessage(text)
    setVoiceState('processing')
    voiceStateRef.current = 'processing'

    try {
      const ai = await callAssistant(text)
      await handleAssistantResponse(ai)
    } catch (e) {
      console.error('handleTextSend error:', e)
      setVoiceState('idle')
      startRecording()
    } finally {
      isProcessingRef.current = false
      setIsSendingText(false)
    }
  }

  // ─── 녹음 시작 ───────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isMicMutedRef.current) return
    if (voiceStateRef.current === 'recording') return
    if (isProcessingRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 512
      audioCtx.createMediaStreamSource(stream).connect(analyser)

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []
        stream.getTracks().forEach(t => t.stop())
        if (audioCtx.state !== 'closed') audioCtx.close()
        audioContextRef.current = null

        if (isProcessingRef.current) return
        if (blob.size < 1000) {
          setVoiceState('idle')
          setTimeout(() => startRecording(), 300)
          return
        }
        await processAudio(blob)
      }

      recorder.start()
      setVoiceState('recording')
      voiceStateRef.current = 'recording'
      monitorSilence()
    } catch (e) {
      console.error('Recording error:', e)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const monitorSilence = () => {
    const analyser = analyserRef.current
    if (!analyser) return
    const buf = new Float32Array(analyser.fftSize)
    let speechDetected = false

    const check = () => {
      if (voiceStateRef.current !== 'recording') return
      analyser.getFloatTimeDomainData(buf)
      const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length)
      if (rms > SILENCE_THRESHOLD) {
        speechDetected = true
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      } else if (speechDetected && !silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          mediaRecorderRef.current?.stop()
          silenceTimerRef.current = null
        }, SILENCE_DURATION)
      }
      requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  }

  const processAudio = async (blob: Blob) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setVoiceState('processing')
    voiceStateRef.current = 'processing'

    try {
      const form = new FormData()
      form.append('audio', blob, 'audio.webm')
      const sttRes = await fetch('/api/voice/stt', { method: 'POST', body: form })
      const { transcript } = await sttRes.json()

      if (!transcript?.trim()) {
        setVoiceState('idle')
        setTimeout(() => startRecording(), 300)
        return
      }

      addUserMessage(transcript)
      const ai = await callAssistant(transcript)
      await handleAssistantResponse(ai)
    } catch (e) {
      console.error('processAudio error:', e)
      setVoiceState('idle')
      setTimeout(() => startRecording(), 1000)
    } finally {
      isProcessingRef.current = false
    }
  }

  const toggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false)
      isMicMutedRef.current = false
      setTimeout(() => startRecording(), 200)
    } else {
      setIsMicMuted(true)
      isMicMutedRef.current = true
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
      setVoiceState('idle')
    }
  }

  const clearAnimal = () => {
    setSelectedAnimal(null)
    selectedAnimalRef.current = null
    setPendingAction(null)
    pendingActionRef.current = null
  }

  const stateColor = {
    idle: isMicMuted ? 'bg-red-400' : 'bg-gray-300',
    recording: 'bg-green-500 animate-pulse',
    processing: 'bg-yellow-400 animate-pulse',
  }[voiceState]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col" hideClose>
        {/* 접근성용 숨김 타이틀 */}
        <SheetTitle className="sr-only">AI 음성 도우미</SheetTitle>

        {/* 커스텀 헤더 */}
        <div className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Bot className="w-5 h-5 text-primary shrink-0" />
              <span className="text-base font-semibold truncate">AI 음성 도우미</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('w-2 h-2 rounded-full', stateColor)} />
              <span className="text-xs text-muted-foreground">
                {voiceState === 'recording' ? '듣는 중' : voiceState === 'processing' ? '처리 중' : isMicMuted ? '음소거' : '대기'}
              </span>
              <SheetClose className="ml-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
                <span className="sr-only">닫기</span>
              </SheetClose>
            </div>
          </div>
          {selectedAnimal && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                <span>{selectedAnimal.name || selectedAnimal.uniqueId}</span>
                {selectedAnimal.speciesName && <span className="text-primary/60">· {selectedAnimal.speciesName}</span>}
                <button onClick={clearAnimal} className="ml-1 hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={cn('flex flex-col gap-2', msg.role === 'bot' ? 'items-start' : 'items-end')}>
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                msg.role === 'bot'
                  ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              )}>
                {msg.text}
              </div>

              {/* 개체 검색 결과 */}
              {msg.animalResults && msg.animalResults.length > 0 && (
                <div className="w-full max-w-[85%] border rounded-xl overflow-hidden divide-y bg-white shadow-sm">
                  {msg.animalResults.map(a => (
                    <button key={a.id} onClick={() => handleSelectAnimal(a)}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors">
                      <div>
                        <span className="font-medium">{a.name || '이름없음'}</span>
                        <span className="text-gray-400 ml-2 text-xs">{a.uniqueId}</span>
                        {a.speciesName && <span className="text-gray-500 ml-1 text-xs">· {a.speciesName}</span>}
                        {a.morphName && <span className="text-gray-400 ml-1 text-xs">· {a.morphName}</span>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* 네비게이션 버튼 */}
              {msg.navAction && (
                <Button size="sm" variant="outline" className="text-xs"
                  onClick={() => { router.push(msg.navAction!.url); onOpenChange(false) }}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  {msg.navAction.label}
                </Button>
              )}
            </div>
          ))}

          {/* 로딩 */}
          {(voiceState === 'processing' || isSearching) && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border-t px-4 pt-3 pb-5 space-y-2 bg-white">
          {/* 마이크 상태 */}
          <div className={cn(
            'flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs transition-colors',
            voiceState === 'recording' ? 'bg-green-50 text-green-700' :
            voiceState === 'processing' ? 'bg-yellow-50 text-yellow-700' :
            'bg-gray-50 text-gray-400'
          )}>
            {voiceState === 'recording' && <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />말씀해주세요...</>}
            {voiceState === 'processing' && <><Loader2 className="w-3.5 h-3.5 animate-spin" />분석 중...</>}
            {voiceState === 'idle' && (isMicMuted ? <><MicOff className="w-3.5 h-3.5" />음소거 — 텍스트로 입력하세요</> : '대기 중...')}
          </div>

          {/* 텍스트 입력 */}
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMic}
              className={cn('shrink-0', isMicMuted && 'text-red-400')}>
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              placeholder="메시지를 입력하세요..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSend() } }}
              disabled={isSendingText || voiceState === 'processing'}
            />
            <Button size="icon" onClick={handleTextSend}
              disabled={!textInput.trim() || isSendingText || voiceState === 'processing'}
              className="shrink-0">
              {isSendingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// 페이지 URL → 라벨
function navLabel(url: string): string {
  const map: Record<string, string> = {
    '/animals': '개체 관리 보기',
    '/animals/voice-register': 'AI 개체 등록 열기',
    '/feedings': '피딩 기록 보기',
    '/feeding-calendar': '피딩 캘린더 보기',
    '/pairings': '메이팅 관리 보기',
    '/incubation': '알 관리 보기',
    '/customers': '고객 관리 보기',
    '/sales': '판매이력 보기',
    '/stats': '통계 보기',
  }
  return map[url] || '페이지 이동'
}
