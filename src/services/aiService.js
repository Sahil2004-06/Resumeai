import { supabase } from './supabase'

async function invoke(functionName, body) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.functions.invoke(functionName, { body })
  if (error) {
    let details = error.message || 'The AI service could not complete this request.'
    if (error.context instanceof Response) {
      try {
        const payload = await error.context.clone().json()
        if (payload.error) details = payload.error
      } catch {
        // Keep the SDK message when the function did not return JSON.
      }
    }
    throw new Error(details)
  }
  return data
}

export const analyzeResume = (text) => invoke('analyze-resume', { text })
export const analyzeJob = (description, title, company) => invoke('analyze-job', { description, title, company })
export const tailorResume = (resume, jobDescription) => invoke('tailor-resume', { resume, jobDescription })
