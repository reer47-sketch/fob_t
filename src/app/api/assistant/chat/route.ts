import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function loadSystemPrompt(): string {
  const docsPath = join(process.cwd(), 'docs', 'support.md')
  const supportDoc = readFileSync(docsPath, 'utf-8')
  return `${supportDoc}\n\n## 오늘 날짜\n${new Date().toISOString().split('T')[0]}`
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
