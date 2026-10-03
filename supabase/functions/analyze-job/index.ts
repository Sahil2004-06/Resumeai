import { corsHeaders, json } from '../_shared/cors.js'
import { askGemini, requireUser } from '../_shared/gemini.js'
import { jobAnalysisSchema, parseModelJson } from '../_shared/validation.js'
import { jobAnalyzerPrompt } from '../_shared/prompts.js'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = await requireUser(request); if (auth.response) return auth.response
    const { description, title = '', company = '' } = await request.json()
    if (typeof description !== 'string' || description.trim().length < 30 || description.length > 100000) return json({ error: 'Job description must be between 30 and 100000 characters.' }, 400)
    const result = jobAnalysisSchema(parseModelJson(await askGemini(jobAnalyzerPrompt, JSON.stringify({ title, company, description }))))
    return json({ data: result })
  } catch (error) { console.error(error); return json({ error: error instanceof Error ? error.message : 'Job analysis failed. Please try again.' }, 500) }
})
