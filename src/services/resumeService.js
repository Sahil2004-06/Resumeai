import { supabase } from './supabase'

const requireClient = () => {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

export async function listResumes() {
  const client = requireClient()
  const { data, error } = await client.from('resumes').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveResume(resume) {
  const client = requireClient()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) throw new Error('You must be signed in to save a resume.')
  const { data, error } = await client.from('resumes').upsert({ ...resume, user_id: userData.user.id, updated_at: new Date().toISOString() }).select().single()
  if (error) throw error
  return data
}

export async function createResumeVersion(version) {
  const client = requireClient()
  const { data, error } = await client.from('resume_versions').insert(version).select().single()
  if (error) throw error
  return data
}
