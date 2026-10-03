import { corsHeaders, json } from '../_shared/cors.js'

const clean = (value) => String(value || '').trim()
const normalize = (value) => clean(value).toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ')

function resumeSkills(resume) {
  const technicalSkills = Object.values(resume?.technicalSkills || {}).flat()
  const skills = [...(resume?.skills || []), ...technicalSkills, ...(resume?.softSkills || [])]
  return [...new Set(skills.map(clean).filter(Boolean))]
}

function buildQuery(resume, requestedQuery) {
  if (clean(requestedQuery)) return clean(requestedQuery).slice(0, 120)
  const rawRole = clean(resume?.personal?.role)
  const role = rawRole.match(/(?:software|frontend|backend|full[- ]stack|web|mobile|data|devops|qa|test|product|ui\/?ux|machine learning|artificial intelligence)\s+(?:engineer|developer|designer|analyst|scientist|manager|architect|intern)/i)?.[0] || ''
  const skills = resumeSkills(resume).map((skill) => skill.slice(0, 30)).slice(0, 6)
  const query = [role || 'software engineer', ...skills].filter(Boolean).join(' ').slice(0, 180)
  return query || 'software engineer'
}

function inferCountry(location) {
  const value = normalize(location)
  if (/india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|gurgaon|gurugram|noida|kolkata/.test(value)) return 'in'
  if (/united states|usa|us|new york|california|texas|seattle|boston|chicago/.test(value)) return 'us'
  return 'in'
}

function buildProviderQuery(query, location, country) {
  const target = location || (country === 'in' ? 'India' : 'United States')
  const normalizedQuery = normalize(query)
  const queryWithJobs = /\bjobs?\b/i.test(query) ? query : `${query} jobs`
  return normalizedQuery.includes(normalize(target)) ? queryWithJobs : `${queryWithJobs} in ${target}`
}

function extractJobSkills(job) {
  const grouped = [
    job?.job_required_skills,
    job?.required_skills,
    job?.job_skills,
    job?.skills,
    job?.job_highlights?.Qualifications,
    job?.job_highlights?.requirements,
    job?.job_highlights?.Skills,
    job?.keywords,
  ]

  const flat = grouped.flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean)
  const cleaned = [...new Set(flat.map((item) => clean(item)).filter(Boolean))]
  return cleaned.slice(0, 12)
}

function scoreJob(job, resume) {
  const skills = resumeSkills(resume)
  const jobText = normalize(`${job.job_title || ''} ${job.job_description || ''}`)
  const matchedSkills = skills.filter((skill) => jobText.includes(normalize(skill)))
  const missingSkills = skills.filter((skill) => !matchedSkills.includes(skill)).slice(0, 8)
  const skillScore = skills.length ? Math.round((matchedSkills.length / skills.length) * 60) : 0
  const role = normalize(resume?.personal?.role)
  const titleScore = role && normalize(job.job_title).includes(role) ? 25 : role ? 10 : 0
  const location = normalize(resume?.personal?.location)
  const jobLocation = normalize(`${job.job_location || ''} ${job.job_city || ''} ${job.job_state || ''}`)
  const locationScore = !location || job.job_is_remote || jobLocation.includes(location) ? 15 : 5
  return { matchScore: Math.min(100, skillScore + titleScore + locationScore), matchedSkills, missingSkills }
}

function mapJob(job, resume) {
  const match = scoreJob(job, resume)
  const actualSkills = extractJobSkills(job)
  const skillList = actualSkills.length ? [...new Set([...actualSkills, ...match.matchedSkills])] : match.matchedSkills
  return {
    id: job.job_id || job.job_apply_link || job.job_google_link || `${job.employer_name}-${job.job_title}`,
    title: job.job_title || 'Untitled role',
    company: job.employer_name || 'Company',
    location: job.job_is_remote ? 'Remote' : job.job_location || [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || 'Location not listed',
    url: job.job_apply_link || job.job_google_link || '#',
    description: job.job_description || '',
    salary: job.job_min_salary && job.job_max_salary ? `${job.job_min_salary}-${job.job_max_salary} ${job.job_salary_currency || ''}`.trim() : '',
    postedAt: job.job_posted_at_datetime_utc || job.job_posted_at || '',
    skills: skillList,
    missingSkills: match.missingSkills,
    matchScore: match.matchScore,
  }
}

async function searchAlternativeJobs(query, resume, country) {
  const response = await fetch('https://www.arbeitnow.com/api/job-board-api?page=1')
  if (!response.ok) return []
  const payload = await response.json()
  const terms = normalize(query).split(' ').filter((term) => term.length > 2)
  const countryTerms = country === 'in'
    ? ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'gurgaon', 'gurugram', 'noida', 'kolkata']
    : ['united states', 'usa', 'new york', 'california', 'texas', 'seattle', 'boston', 'chicago']
  const rows = Array.isArray(payload.data) ? payload.data : []
  return rows
    .filter((job) => {
      const text = normalize(`${job.title || ''} ${job.company_name || ''} ${job.description || ''} ${(job.tags || []).join(' ')}`)
      const jobLocation = normalize(job.location)
      const matchesCountry = job.remote || countryTerms.some((term) => jobLocation.includes(term) || text.includes(term))
      return matchesCountry && (!terms.length || terms.some((term) => text.includes(term)))
    })
    .slice(0, 12)
    .map((job) => mapJob({
      job_id: job.slug || job.url,
      job_title: job.title,
      employer_name: job.company_name,
      job_location: job.location,
      job_is_remote: Boolean(job.remote),
      job_apply_link: job.url,
      job_description: job.description,
      job_required_skills: job.tags,
      job_posted_at: job.created_at,
    }, resume))
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const rawBody = await request.text()
    let body = {}
    if (rawBody) {
      try {
        body = JSON.parse(rawBody)
      } catch {
        return json({ error: 'Invalid JSON body sent to the jobs search endpoint.' }, 400)
      }
    }
    const resume = body?.resume && typeof body.resume === 'object' ? body.resume : {}
    const query = buildQuery(resume, body?.query)
    const location = clean(body?.location || resume.personal?.location)
    const country = inferCountry(location)
    const providerQuery = buildProviderQuery(query, location, country)
    const url = new URL('https://jsearch.p.rapidapi.com/search-v2')
    url.searchParams.set('query', providerQuery)
    url.searchParams.set('page', '1')
    url.searchParams.set('num_pages', '1')
    url.searchParams.set('country', country)
    if (body?.remoteOnly) url.searchParams.set('work_from_home', 'true')

    const apiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!apiKey) return json({ error: 'RAPIDAPI_KEY is not configured in Supabase secrets.' }, 500)
    const response = await fetch(url, { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' } })
    const responseText = await response.text()
    let payload = {}
    try {
      payload = responseText ? JSON.parse(responseText) : {}
    } catch {
      payload = { message: responseText }
    }
    if (!response.ok) return json({ error: payload?.message || `Jobs provider returned HTTP ${response.status}.` }, response.status)
    const providerJobs = [payload.data, payload.data?.jobs, payload.data?.results, payload.jobs, payload.results].find(Array.isArray) || []
    const jobs = providerJobs.map((job) => mapJob(job, resume)).sort((left, right) => right.matchScore - left.matchScore)
    const targetLabel = country === 'in' ? 'Indian' : 'matching'
    return json({ query: providerQuery, jobs, source: 'jsearch', message: jobs.length ? undefined : `JSearch returned no ${targetLabel} jobs for this search. Try a broader role or city.` })
  } catch (error) {
    console.error(error)
    return json({ error: error instanceof Error ? error.message : 'Job search failed. Please try again.' }, 500)
  }
})
