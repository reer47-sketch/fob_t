'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, ChevronRight, Check, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createAnimal } from '@/actions/animals/create-animal'
import { getSpeciesAction } from '@/actions/codes/get-species'
import { getTraitsAndColorsBySpeciesId } from '@/actions/codes/get-codes-by-species'
import { searchParentAnimals } from '@/actions/animals/search-parent-animals'

// ─── 타입 ────────────────────────────────────────────────────────────────────
interface Code { id: string; name: string; code: string }
interface ParentInfo {
  id: string; name: string | null; uniqueId: string
  gender: string; speciesName?: string; morphName?: string
}
interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  text: string
}
interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}
interface FormState {
  speciesId?: string; speciesName?: string
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN'
  acquisitionType?: 'ADOPTION' | 'HATCHING'
  acquisitionDate?: string; hatchDate?: string
  primaryMorphId?: string; primaryMorphName?: string
  comboMorphIds?: string[]; comboMorphNames?: string[]
  name?: string; isBreeding?: boolean
  fathers?: ParentInfo[]; mothers?: ParentInfo[]
  imageFile?: File | null
}

type VoiceState = 'idle' | 'recording' | 'processing'

const SILENCE_THRESHOLD = 0.01
const SILENCE_DURATION = 1500

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export function VoiceChatbot() {
  const router = useRouter()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([])
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [isSendingText, setIsSendingText] = useState(false)

  const [formState, setFormState] = useState<FormState>({})
  const [speciesList, setSpeciesList] = useState<Code[]>([])
  const [morphList, setMorphList] = useState<Code[]>([])

  const [showParentSearch, setShowParentSearch] = useState<'father' | 'mother' | null>(null)
  const [parentSearch, setParentSearch] = useState('')
  const [parentResults, setParentResults] = useState<ParentInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  const isProcessingRef = useRef(false)
  const msgCounterRef = useRef(0)
  const nextMsgId = () => `msg-${++msgCounterRef.current}`
  const hasInitRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const voiceStateRef = useRef<VoiceState>('idle')
  const isMicMutedRef = useRef(false)
  const formStateRef = useRef<FormState>({})
  const speciesListRef = useRef<Code[]>([])
  const morphListRef = useRef<Code[]>([])
  const apiMessagesRef = useRef<ApiMessage[]>([])

  useEffect(() => { voiceStateRef.current = voiceState }, [voiceState])
  useEffect(() => { isMicMutedRef.current = isMicMuted }, [isMicMuted])
  useEffect(() => { formStateRef.current = formState }, [formState])
  useEffect(() => { speciesListRef.current = speciesList }, [speciesList])
  useEffect(() => { morphListRef.current = morphList }, [morphList])
  useEffect(() => { apiMessagesRef.current = apiMessages }, [apiMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, voiceState])

  // ─── 초기화 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasInitRef.current) return
    hasInitRef.current = true

    ;(async () => {
      const res = await getSpeciesAction()
      if (res.success && res.data) setSpeciesList(res.data as Code[])

      const greeting = '안녕하세요! 개체 등록을 도와드릴게요. 종, 성별, 해칭인지 입양인지 편하게 말씀해주세요.'
      addBotMessage(greeting)
      startRecording()
    })()

    return () => cleanup()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cleanup = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close()
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
  }

  // ─── 메시지 ──────────────────────────────────────────────────────────────
  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, { id: nextMsgId(), role: 'bot', text }])
    setApiMessages(prev => [...prev, { role: 'assistant', content: text }])
  }

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: nextMsgId(), role: 'user', text }])
  }

  // ─── Claude 호출 ─────────────────────────────────────────────────────────
  const callClaude = async (userText: string, currentApiMessages: ApiMessage[]) => {
    const newApiMessages: ApiMessage[] = [
      ...currentApiMessages,
      { role: 'user', content: userText },
    ]
    setApiMessages(newApiMessages)

    const chatRes = await fetch('/api/voice/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newApiMessages,
        formState: formStateRef.current,
        speciesList: speciesListRef.current,
        morphList: morphListRef.current,
      }),
    })
    return { aiResponse: await chatRes.json(), newApiMessages }
  }

  // ─── 폼 업데이트 (이름→ID 매칭 포함) ────────────────────────────────────
  const applyFormUpdate = async (patch: Partial<FormState>) => {
    if (!patch || Object.keys(patch).length === 0) return

    if (patch.speciesName && !patch.speciesId) {
      const q = patch.speciesName.toLowerCase()
      const matched = speciesListRef.current.find(s =>
        s.name.toLowerCase().includes(q) || q.includes(s.name.toLowerCase())
      )
      if (matched) {
        patch.speciesId = matched.id
        patch.speciesName = matched.name
        if (matched.id !== formStateRef.current.speciesId) {
          const morphRes = await getTraitsAndColorsBySpeciesId(matched.id)
          if (morphRes.success && morphRes.data) {
            const morphs = morphRes.data.morphs as Code[]
            setMorphList(morphs)
            morphListRef.current = morphs
          }
        }
      } else {
        delete patch.speciesId
      }
    }

    if (patch.primaryMorphName && !patch.primaryMorphId) {
      const q = patch.primaryMorphName.toLowerCase()
      const matched = morphListRef.current.find(m =>
        m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())
      )
      if (matched) { patch.primaryMorphId = matched.id; patch.primaryMorphName = matched.name }
      else delete patch.primaryMorphId
    }

    if (patch.comboMorphNames?.length) {
      const ids: string[] = []; const names: string[] = []
      for (const name of patch.comboMorphNames) {
        const q = name.toLowerCase()
        const matched = morphListRef.current.find(m =>
          m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())
        )
        if (matched) { ids.push(matched.id); names.push(matched.name) }
      }
      patch.comboMorphIds = ids; patch.comboMorphNames = names
    }

    const updated = { ...formStateRef.current, ...patch }
    setFormState(updated)
    formStateRef.current = updated
  }

  // ─── 녹음 시작 ───────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isMicMutedRef.current) return
    if (voiceStateRef.current === 'recording') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 512

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []
        stream.getTracks().forEach(t => t.stop())
        if (audioCtx.state !== 'closed') audioCtx.close()
        audioContextRef.current = null

        // text input may have already taken over processing
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

  // ─── 무음 감지 ───────────────────────────────────────────────────────────
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
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
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

  // ─── 오디오 처리 (STT → Claude) ──────────────────────────────────────────
  const processAudio = async (blob: Blob) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setVoiceState('processing')
    voiceStateRef.current = 'processing'

    try {
      const sttForm = new FormData()
      sttForm.append('audio', blob, 'audio.webm')
      const sttRes = await fetch('/api/voice/stt', { method: 'POST', body: sttForm })
      const { transcript } = await sttRes.json()

      if (!transcript?.trim()) {
        setVoiceState('idle')
        setTimeout(() => startRecording(), 300)
        return
      }

      addUserMessage(transcript)
      const { aiResponse } = await callClaude(transcript, apiMessagesRef.current)
      await handleAiResponse(aiResponse)
    } catch (e) {
      console.error('processAudio error:', e)
      setVoiceState('idle')
      setTimeout(() => startRecording(), 1000)
    } finally {
      isProcessingRef.current = false
    }
  }

  // ─── 텍스트 입력 전송 ─────────────────────────────────────────────────────
  const handleTextSend = async () => {
    const text = textInput.trim()
    if (!text || isSendingText) return

    setTextInput('')
    setIsSendingText(true)
    isProcessingRef.current = true

    // 녹음 중이면 중지 (onstop이 isProcessingRef 확인하여 processAudio 건너뜀)
    if (voiceStateRef.current === 'recording') {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }

    addUserMessage(text)
    setVoiceState('processing')
    voiceStateRef.current = 'processing'

    try {
      const { aiResponse } = await callClaude(text, apiMessagesRef.current)
      await handleAiResponse(aiResponse)
    } catch (e) {
      console.error('handleTextSend error:', e)
      setVoiceState('idle')
      startRecording()
    } finally {
      isProcessingRef.current = false
      setIsSendingText(false)
    }
  }

  // ─── AI 응답 처리 ─────────────────────────────────────────────────────────
  const handleAiResponse = async (aiResponse: {
    message?: string
    formUpdate?: Partial<FormState>
    isComplete?: boolean
    needsPhotoUpload?: boolean
    needsParentSearch?: boolean
  }) => {
    if (aiResponse.formUpdate && Object.keys(aiResponse.formUpdate).length > 0) {
      await applyFormUpdate({ ...aiResponse.formUpdate })
    }

    if (aiResponse.needsParentSearch) setShowParentSearch('father')
    if (aiResponse.needsPhotoUpload) setShowPhotoUpload(true)
    if (aiResponse.isComplete) setIsComplete(true)

    const botMsg = aiResponse.message || '죄송해요, 다시 말씀해주세요.'
    addBotMessage(botMsg)

    if (!aiResponse.isComplete) {
      setVoiceState('idle')
      startRecording()
    } else {
      setVoiceState('idle')
    }
  }

  // ─── 마이크 토글 ─────────────────────────────────────────────────────────
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

  // ─── 부모 검색 ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showParentSearch || parentSearch.length < 1) { setParentResults([]); return }
    const gender = showParentSearch === 'father' ? 'MALE' : 'FEMALE'
    setIsSearching(true)
    searchParentAnimals(parentSearch, gender)
      .then(res => { if (res.success && 'data' in res) setParentResults(res.data as ParentInfo[]) })
      .finally(() => setIsSearching(false))
  }, [parentSearch, showParentSearch])

  const selectParent = (parent: ParentInfo) => {
    const role = showParentSearch
    setFormState(prev => ({
      ...prev,
      fathers: role === 'father' ? [parent] : prev.fathers,
      mothers: role === 'mother' ? [parent] : prev.mothers,
    }))
    setShowParentSearch(null)
    setParentSearch('')
    setParentResults([])

    const msg = `${role === 'father' ? '아버지' : '어머니'} 개체로 ${parent.name || parent.uniqueId}를 등록했어요.`
    addBotMessage(msg)
    startRecording()
  }

  // ─── 최종 등록 ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const f = formState
    if (!f.gender || !f.acquisitionType || !f.acquisitionDate) return

    setIsSubmitting(true)
    const result = await createAnimal({
      name: f.name || null,
      gender: f.gender,
      acquisitionType: f.acquisitionType,
      acquisitionDate: new Date(f.acquisitionDate),
      hatchDate: f.hatchDate ? new Date(f.hatchDate) : undefined,
      speciesId: f.speciesId,
      primaryMorphId: f.primaryMorphId,
      comboMorphIds: f.comboMorphIds ?? [],
      imageFile: f.imageFile ?? undefined,
      fathers: (f.fathers ?? []).map(p => p.id),
      mothers: (f.mothers ?? []).map(p => p.id),
      isBreeding: f.isBreeding ?? false,
      isPublic: true,
      parentPublic: true,
    })
    setIsSubmitting(false)

    if (result.success) {
      router.push('/animals')
    } else {
      addBotMessage(`오류가 발생했어요: ${'error' in result ? result.error : '다시 시도해주세요.'}`)
    }
  }

  // ─── 렌더 ────────────────────────────────────────────────────────────────
  const stateLabel = {
    idle: isMicMuted ? '마이크 꺼짐' : '대기 중',
    recording: '듣는 중',
    processing: '처리 중',
  }[voiceState]

  const stateColor = {
    idle: isMicMuted ? 'bg-red-400' : 'bg-gray-400',
    recording: 'bg-green-500 animate-pulse',
    processing: 'bg-yellow-500 animate-pulse',
  }[voiceState]

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white">

      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
        <div>
          <h1 className="font-semibold text-gray-900">AI 개체 등록</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn('w-2 h-2 rounded-full', stateColor)} />
            <span className="text-xs text-gray-500">{stateLabel}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMic}
          className={isMicMuted ? 'text-red-400' : ''}>
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
      </div>

      {/* 메시지 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.role === 'bot' ? 'justify-start' : 'justify-end')}>
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              msg.role === 'bot'
                ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm'
            )}>
              {msg.text}
            </div>
          </div>
        ))}

        {voiceState === 'processing' && (
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

      {/* 하단 */}
      <div className="border-t bg-white px-4 pt-3 pb-5 space-y-3">

        {/* 부모 검색 */}
        {showParentSearch && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">
              {showParentSearch === 'father' ? '아버지' : '어머니'} 개체 검색
            </p>
            <div className="flex gap-2">
              <Input placeholder="이름 또는 고유번호" value={parentSearch}
                onChange={e => setParentSearch(e.target.value)} />
              {isSearching && <Loader2 className="w-5 h-5 animate-spin text-gray-400 my-auto" />}
            </div>
            {parentResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {parentResults.map(p => (
                  <button key={p.id} onClick={() => selectParent(p)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between">
                    <span>
                      <span className="font-medium">{p.name || '이름없음'}</span>
                      <span className="text-gray-400 ml-2 text-xs">{p.uniqueId}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full"
              onClick={() => { setShowParentSearch(null); startRecording() }}>
              건너뛰기
            </Button>
          </div>
        )}

        {/* 사진 업로드 */}
        {showPhotoUpload && (
          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
              📷 사진 선택
              <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null
                  setFormState(prev => ({ ...prev, imageFile: file }))
                  setShowPhotoUpload(false)
                  startRecording()
                }} />
            </label>
            <Button variant="outline" onClick={() => { setShowPhotoUpload(false); startRecording() }}>
              건너뛰기
            </Button>
          </div>
        )}

        {/* 등록 완료 */}
        {isComplete && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              {([
                ['종', formState.speciesName],
                ['성별', formState.gender === 'MALE' ? '수컷' : formState.gender === 'FEMALE' ? '암컷' : '미확인'],
                ['구분', formState.acquisitionType === 'HATCHING' ? '해칭' : '입양'],
                ['등록일', formState.acquisitionDate],
                formState.hatchDate ? ['해칭일', formState.hatchDate] : null,
                ['모프', formState.primaryMorphName || '없음'],
                ['이름', formState.name || '없음'],
                ['브리딩', formState.isBreeding ? '예' : '아니오'],
              ] as [string, string | undefined][]).filter((row): row is [string, string] => row !== null).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />등록 중...</> : <><Check className="w-4 h-4 mr-2" />등록하기</>}
              </Button>
              <Button variant="outline" onClick={() => { setIsComplete(false); startRecording() }}>
                수정하기
              </Button>
            </div>
          </div>
        )}

        {/* 텍스트 입력 + 마이크 상태 */}
        {!showParentSearch && !showPhotoUpload && (
          <div className="space-y-2">
            {/* 녹음 상태 표시 */}
            {!isComplete && (
              <div className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-full text-xs',
                voiceState === 'recording' ? 'bg-green-50 text-green-700' :
                voiceState === 'processing' ? 'bg-yellow-50 text-yellow-700' :
                'bg-gray-50 text-gray-400'
              )}>
                {voiceState === 'recording' && (
                  <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />말씀해주세요...</>
                )}
                {voiceState === 'processing' && <><Loader2 className="w-3.5 h-3.5 animate-spin" />분석 중...</>}
                {voiceState === 'idle' && (isMicMuted ? <><MicOff className="w-3.5 h-3.5" />마이크 꺼짐 — 텍스트로 입력하세요</> : '준비 중...')}
              </div>
            )}

            {/* 텍스트 입력창 */}
            <div className="flex gap-2">
              <Input
                placeholder="텍스트로 입력하세요..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSend() } }}
                disabled={isSendingText || voiceState === 'processing'}
              />
              <Button size="icon" onClick={handleTextSend}
                disabled={!textInput.trim() || isSendingText || voiceState === 'processing'}>
                {isSendingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
