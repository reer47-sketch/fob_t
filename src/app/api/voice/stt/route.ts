export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File

    if (!audio) return Response.json({ error: 'No audio file' }, { status: 400 })

    const efData = new FormData()
    efData.append('file', audio, 'audio.webm')
    efData.append('model_id', 'scribe_v1')
    efData.append('language_code', 'ko')

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
      body: efData,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('ElevenLabs STT error:', err)
      return Response.json({ error: 'STT failed' }, { status: 500 })
    }

    const data = await res.json()
    return Response.json({ transcript: data.text ?? '' })
  } catch (e) {
    console.error('STT route error:', e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
