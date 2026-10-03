import { supabase } from './supabase.js'

import { buildJobSearchQuery, fallbackJobs, normalizeJobResult } from './jobSearchUtils.js'

export async function searchJobsForResume(resume, options = {}) {
  if (!supabase) {
    return { configured: false, query: buildJobSearchQuery(resume, options.query || ''), jobs: fallbackJobs }
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  try {
    const { data, error } = await supabase.functions.invoke('search-jobs', {
      body: { resume, ...options },
      headers: anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : undefined,
    })
    if (error) {
      let details = error.message || 'The jobs service could not complete this request.'
      const response = error.context && typeof error.context.json === 'function' ? error.context : null
      if (response) {
        try {
          const payload = await (typeof response.clone === 'function' ? response.clone() : response).json()
          if (payload.error) details = payload.error
          if (payload.message) details = payload.message
        } catch {
          try {
            const text = await (typeof response.clone === 'function' ? response.clone() : response).text()
            if (text) details = text
          } catch {
            // Keep the SDK message when the function did not return a readable body.
          }
        }
      }
      return { configured: false, query: buildJobSearchQuery(resume, options.query || ''), jobs: fallbackJobs, message: details }
    }

    const jobs = (data.jobs || []).map((job) => normalizeJobResult(job))
    return { configured: true, query: data.query, jobs, message: data.message || '' }
  } catch (error) {
    return {
      configured: false,
      query: buildJobSearchQuery(resume, options.query || ''),
      jobs: fallbackJobs,
      message: error instanceof Error ? error.message : 'The jobs service could not complete this request.',
    }
  }
}

export async function searchJobs(query = '') {
  const endpoint = import.meta.env.VITE_JOBS_API_URL
  if (!endpoint) return { jobs: fallbackJobs, configured: false }
  const response = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('The jobs provider could not be reached.')
  const payload = await response.json()
  const rows = Array.isArray(payload) ? payload : payload.jobs || payload.results || []
  return { configured: true, jobs: rows.map((job) => normalizeJobResult(job)) }
}

export function buildQueryForResume(resume, requestedQuery = '') {
  return buildJobSearchQuery(resume, requestedQuery)
}
