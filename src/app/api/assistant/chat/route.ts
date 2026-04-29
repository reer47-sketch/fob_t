import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function loadSystemPrompt(): string {
  const docsPath = join(process.cwd(), 'docs')
  const supportDoc = readFileSync(join(docsPath, 'support.md'), 'utf-8')

  let caresheetSection = ''
  try {
    const caresheet = readFileSync(join(docsPath, 'caresheet.md'), 'utf-8')
    caresheetSection = `\n\n---\n\n## 사육 케어시트 (Care Guide)\n\n사용자가 사육 방법, 먹이, 온도, 습도, 번식, 건강 등 사육 관련 질문을 하면 아래 케어시트를 참고해서 답변하세요. 케어시트에 없는 내용은 모른다고 솔직하게 말하세요.\n\n${caresheet}`
  } catch {
    // caresheet.md 없으면 무시
  }

  return `${supportDoc}${caresheetSection}\n\n## 오늘 날짜\n${new Date().toISOString().split('T')[0]}`
}

export async function POST(req: Request) {
  try {
    const { messages, selectedAnimal } = await req.json()

    const basePrompt = loadSystemPrompt()
    const systemWithContext = selectedAnimal
      ? `${basePrompt}\n\n## 현재 선택된 개체\n이름: ${selectedAnimal.name || '없음'}, 고유번호: ${selectedAnimal.uniqueId}, 성별: ${selectedAnimal.gender}${selectedAnimal.speciesName ? ', 종: ' + selectedAnimal.speciesName : ''}`
      : basePrompt

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemWithContext,
      messages,
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])

    return Response.json(parsed)
  } catch (e) {
    console.error('Assistant chat error:', e)
    return Response.json({
      message: '죄송해요, 잠시 오류가 발생했어요. 다시 말씀해주세요.',
      intent: 'GENERAL',
      action: null,
    })
  }
}
