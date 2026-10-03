import { json } from './cors.js'

export async function requireUser(request) {
  if (!request.headers.get('Authorization')) return { response: json({ error: 'Authentication required.' }, 401) }
  return { user: true }
}

export async function askGemini(systemInstruction, userContent) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.')
  const requestBody = JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents: [{ role: 'user', parts: [{ text: userContent }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
  let lastReason = 'Gemini is temporarily unavailable. Please try again.'
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody })
      if (response.ok) {
        const payload = await response.json()
        return payload.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      }
      let reason = `Gemini request failed (${response.status}).`
      try {
        const payload = await response.json()
        const providerMessage = payload.error?.message
        if (providerMessage) reason = `Gemini: ${providerMessage}`
      } catch {
        // Keep the status-based message when the provider response is not JSON.
      }
      lastReason = reason
      const temporary = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503
      if (!temporary) break
      if (attempt === 0) {
        const retryAfter = Number(response.headers.get('Retry-After'))
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 5000)))
      }
    }
  }
  throw new Error(lastReason.includes('high demand') ? 'Gemini is experiencing high demand. Please try again in a moment.' : lastReason)
}
