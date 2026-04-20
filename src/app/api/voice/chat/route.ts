import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(speciesList: any[], morphList: any[], formState: any) {
  return `당신은 도마뱀 브리더 샵의 개체 등록을 도와주는 AI 어시스턴트입니다.
사용자와 자연스러운 한국어 대화를 통해 개체 등록 정보를 수집합니다.

## 수집해야 할 정보
필수:
- speciesId / speciesName: 종
- gender: 성별 (MALE=수컷, FEMALE=암컷, UNKNOWN=미확인)
- acquisitionType: 입수 방법 (HATCHING=해칭, ADOPTION=입양)
- acquisitionDate: 등록일 (ISO 날짜 문자열, 예: "2025-04-19")

선택:
- hatchDate: 해칭일 (해칭인 경우)
- primaryMorphId / primaryMorphName: 대표 모프
- comboMorphIds / comboMorphNames: 콤보 모프 (배열)
- name: 개체 이름
- isBreeding: 브리딩 대상 여부 (boolean)

## 사용 가능한 종 목록
${speciesList.length > 0 ? JSON.stringify(speciesList, null, 2) : '(아직 로딩되지 않음)'}

## 사용 가능한 모프 목록
${morphList.length > 0 ? JSON.stringify(morphList, null, 2) : '(종 선택 후 표시됨)'}

## 현재 수집된 정보
${JSON.stringify(formState, null, 2)}

## 오늘 날짜
${new Date().toISOString().split('T')[0]}

## 응답 규칙
1. 반드시 아래 JSON 형식으로만 응답 (다른 텍스트 없이)
2. 사용자가 한 문장에 여러 정보를 말해도 모두 파악하여 formUpdate에 포함
3. 종/모프는 목록과 유사하면 매칭 (예: "크레스티 게코" → 크레스티드 게코)
4. 날짜 표현 처리: "오늘"→오늘날짜, "어제"→어제날짜, "그제"→그제날짜
5. 다음으로 물어볼 정보는 1가지만 (너무 많이 한번에 묻지 말 것)
6. 친근하고 자연스러운 말투 사용
7. 모든 필수 정보가 수집되면 isComplete: true

## 응답 JSON 형식
{
  "message": "사용자에게 전달할 자연스러운 한국어 메시지",
  "formUpdate": {
    // 이번 대화에서 새로 파악된 필드만 포함 (없으면 빈 객체 {})
    // ⚠️ 중요: speciesId, primaryMorphId, comboMorphIds는 절대 포함하지 말 것
    // 이름(speciesName, primaryMorphName, comboMorphNames)만 반환할 것
    // ID 매칭은 클라이언트에서 처리함
  },
  "isComplete": false,
  "needsPhotoUpload": false,
  "needsParentSearch": false
}`
}

export async function POST(req: Request) {
  try {
    const { messages, formState, speciesList, morphList } = await req.json()

    const systemPrompt = buildSystemPrompt(speciesList ?? [], morphList ?? [], formState ?? {})

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // JSON 파싱
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])

    return Response.json(parsed)
  } catch (e) {
    console.error('Chat route error:', e)
    return Response.json({
      message: '죄송해요, 잠시 오류가 발생했어요. 다시 말씀해주세요.',
      formUpdate: {},
      isComplete: false,
    })
  }
}
