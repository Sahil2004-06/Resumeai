export const fallbackJobs = [
  {
    id: 'linear-senior-frontend-engineer',
    title: 'Senior Frontend Engineer',
    company: 'Linear',
    location: 'Remote • US',
    url: 'https://linear.app/careers',
    description: 'Build polished product experiences with React and TypeScript.',
    skills: ['React', 'TypeScript', 'Design systems'],
    matchScore: 94,
  },
  {
    id: 'notion-product-engineer',
    title: 'Product Engineer',
    company: 'Notion',
    location: 'San Francisco, CA',
    url: 'https://www.notion.so/careers',
    description: 'Ship thoughtful, customer-facing product features with a strong frontend stack.',
    skills: ['JavaScript', 'React', 'SQL'],
    matchScore: 89,
  },
  {
    id: 'arcade-fullstack-engineer',
    title: 'Full Stack Engineer',
    company: 'Arcade',
    location: 'Remote • North America',
    url: 'https://www.arcade.ai/careers',
    description: 'Help ship AI-powered workflow tools and product experiences across the stack.',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    matchScore: 87,
  },
]

function fallbackText(value, defaultValue = '') {
  if (value === null || value === undefined) return defaultValue
  const text = String(value).trim()
  return text || defaultValue
}

function cleanedSkills(job) {
  const candidates = [
    job?.skills,
    job?.required_skills,
    job?.job_required_skills,
    job?.matchedSkills,
    job?.job_skills,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) return candidate.map((item) => fallbackText(item)).filter(Boolean)
  }

  return []
}

export function normalizeJobResult(job = {}) {
  const title = fallbackText(job.title || job.job_title || job.position || job.role || 'Untitled role')
  const company = fallbackText(job.company || job.employer_name || job.company_name || 'Company')
  const location = fallbackText(
    job.location || job.job_location || job.location_name || job.job_city || [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || 'Location not listed'
  )
  const url = fallbackText(job.url || job.job_apply_link || job.job_google_link || job.apply_url || job.redirect_url || '#')
  const description = fallbackText(job.description || job.job_description || job.summary || '')
  const skills = cleanedSkills(job)
  const score = Number(job.matchScore ?? job.score ?? job.match_score ?? 0)

  return {
    id: fallbackText(job.id || job.job_id || job.job_apply_link || job.job_google_link || `${company}-${title}`),
    title,
    company,
    location,
    url,
    description,
    skills,
    missingSkills: Array.isArray(job.missingSkills) ? job.missingSkills.filter(Boolean) : [],
    matchScore: Number.isFinite(score) ? score : 0,
  }
}

export function buildJobSearchQuery(resume = {}, requestedQuery = '') {
  const query = fallbackText(requestedQuery)
  if (query) {
    const withJobs = /\bjobs?\b/i.test(query) ? query : `${query} jobs`
    return withJobs.slice(0, 180)
  }

  const role = fallbackText(resume?.personal?.role)
  const skills = Array.from(new Set([...(resume?.skills || []), ...(resume?.technicalSkills ? Object.values(resume.technicalSkills).flat() : []), ...(resume?.softSkills || [])].map((skill) => fallbackText(skill)).filter(Boolean))).slice(0, 6)
  const primaryRole = /(?:software|frontend|backend|full[- ]stack|web|mobile|data|devops|qa|test|product|ui\/?ux|machine learning|artificial intelligence)\s+(?:engineer|developer|designer|analyst|scientist|manager|architect|intern)/i.test(role)
    ? role
    : 'software engineer'

  const parts = [primaryRole, ...skills, 'jobs']
  return parts.filter(Boolean).join(' ').slice(0, 180)
}
