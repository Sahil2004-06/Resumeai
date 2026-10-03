import { corsHeaders, json } from '../_shared/cors.js'
import { askGemini, requireUser } from '../_shared/gemini.js'
import { parseModelJson } from '../_shared/validation.js'
import { tailorPrompt } from '../_shared/prompts.js'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = await requireUser(request); if (auth.response) return auth.response
    const { resume, jobDescription } = await request.json()
    if (!resume || typeof jobDescription !== 'string' || jobDescription.trim().length < 30) return json({ error: 'A resume and job description are required.' }, 400)
    const data = parseModelJson(await askGemini(tailorPrompt, JSON.stringify({ resume, jobDescription })))
    if (!Array.isArray(data.suggestions)) throw new Error('Invalid tailoring response.')
    return json({ data: { summary: typeof data.summary === 'string' ? data.summary : '', suggestions: data.suggestions.map((suggestion) => ({ type: String(suggestion.type || 'content'), originalText: String(suggestion.originalText || ''), suggestedText: String(suggestion.suggestedText || ''), reason: String(suggestion.reason || '') })), missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords.map(String) : [] } })
  } catch (error) { console.error(error); return json({ error: error instanceof Error ? error.message : 'Resume tailoring failed. Please try again.' }, 500) }
})
