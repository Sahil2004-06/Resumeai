import { corsHeaders, json } from '../_shared/cors.js'
import { askGemini, requireUser } from '../_shared/gemini.js'
import { parseModelJson, resumeSchema } from '../_shared/validation.js'
import { resumeParserPrompt } from '../_shared/prompts.js'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = await requireUser(request); if (auth.response) return auth.response
    const { text } = await request.json()
    if (typeof text !== 'string' || text.trim().length < 20 || text.length > 100000) return json({ error: 'Resume text must be between 20 and 100000 characters.' }, 400)
    const result = resumeSchema(parseModelJson(await askGemini(resumeParserPrompt, text)))
    return json({ data: result })
  } catch (error) { console.error(error); return json({ error: 'Resume analysis failed. Please try again.' }, 500) }
})
