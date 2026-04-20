// 한국어에 잘 맞는 ElevenLabs 음성 ID
// 변경하려면 https://elevenlabs.io/app/voice-library 에서 찾아서 교체
const VOICE_ID = 'nPczCjzI2devNBz1zQrb' // Brian (multilingual)

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) return Response.json({ error: 'No text' }, { status: 400 })

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5', // 가장 빠른 모델 (저지연)
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.1,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('ElevenLabs TTS error:', err)
      return Response.json({ error: 'TTS failed' }, { status: 500 })
    }

    const audioBuffer = await res.arrayBuffer()
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (e) {
    console.error('TTS route error:', e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
