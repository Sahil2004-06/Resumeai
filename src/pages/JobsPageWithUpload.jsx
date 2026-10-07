import { useEffect, useState } from 'react'
import { ArrowUpRight, Search, Upload } from 'lucide-react'
import { analyzeResume } from '../services/aiService.js'
import { extractDocumentText } from '../lib/documentParser.js'
import { listResumes, saveResume } from '../services/resumeService.js'
import { searchJobsForResume } from '../services/jobsService.js'
import { fallbackJobs } from '../services/jobSearchUtils.js'

const commonSkills = ['JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Azure', 'Docker', 'Git', 'Figma', 'HTML', 'CSS', 'Next.js']

function createFallbackResume(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || ''
  const skills = commonSkills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()))
  const role = lines.find((line) => /engineer|developer|designer|analyst|manager|student/i.test(line)) || 'Software Engineer'
  return { personal: { name: lines[0] || 'Uploaded resume', role, email, phone: '', location: '', linkedin: '', github: '' }, summary: lines.slice(0, 4).join(' ').slice(0, 500), experience: [], education: [], skills, projects: [], certifications: [], achievements: [] }
}

export default function JobsPageWithUpload() {
  const [resume, setResume] = useState(null)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState({ jobs: fallbackJobs })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    listResumes().then((savedResumes) => {
      if (cancelled) return

      if (savedResumes?.[0]?.data) {
        const latestResume = savedResumes[0].data
        setResume(latestResume)
        return searchJobsForResume(latestResume, { query }).then((jobsResult) => {
          if (!cancelled) {
            setResult(jobsResult)
            setMessage(jobsResult.message || '')
          }
        })
      }

      setResult({ jobs: fallbackJobs })
    }).catch((error) => {
      if (!cancelled) {
        setMessage(error.message)
        setResult({ jobs: fallbackJobs })
      }
    })

    return () => {
      cancelled = true
    }
  }, [query])

  async function uploadResume(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const text = await extractDocumentText(file)
      if (text.trim().length < 20) throw new Error('We could not find enough readable text in this file.')
      let parsedResume
      let usedFallback = false
      try {
        const parsed = await analyzeResume(text)
        parsedResume = parsed.data || parsed
      } catch (error) {
        if (!/high demand|temporarily unavailable|could not complete/i.test(error.message)) throw error
        parsedResume = createFallbackResume(text)
        usedFallback = true
      }
      await saveResume({ name: parsedResume.personal?.name || file.name, data: parsedResume, template_id: 'clean' })
      setResume(parsedResume)
      const jobsResult = await searchJobsForResume(parsedResume, { query })
      setResult(jobsResult)
      setMessage(jobsResult.message || (usedFallback ? 'Gemini is busy, so basic resume matching was used. Jobs are still live.' : ''))
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  async function findJobs(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const activeResume = resume || {}
      const searchQuery = query.trim() || 'software engineer jobs'
      const jobsResult = await searchJobsForResume(activeResume, { query: searchQuery })
      setResult(jobsResult)
      setMessage(jobsResult.message || '')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Workspace / Job matches</p><h1>Jobs worth a look</h1><p className="heading-copy">Upload a resume and get live listings ranked by fit.</p></div><label className="secondary-button"><Upload size={16} />{busy ? 'Analyzing...' : 'Upload resume'}<input type="file" accept=".pdf,.docx,.txt,.md" hidden disabled={busy} onChange={uploadResume} /></label></div><div className="jobs-layout"><div className="jobs-main"><form className="filter-bar" onSubmit={findJobs}><div className="search-field wide"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Optional role or skill filter" /></div><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Finding...' : 'Find matching jobs'}</button></form>{message && <p className="auth-message">{message}</p>}{result.query && <p className="section-help">Search: {result.query}</p>}{result.jobs.map((job) => <div className="job-detail-card" key={`${job.id}-${job.title}`}><div className="job-row"><div className="company-logo coral">{job.company.slice(0, 1)}</div><div className="job-main"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><div className="skill-tags">{(job.skills || []).map((skill) => <span key={skill}>{skill}</span>)}</div>{job.matchScore !== undefined && <span className="status-pill">{job.matchScore}% match</span>}</div></div><div className="job-card-footer"><span>{job.missingSkills?.length ? `Missing: ${job.missingSkills.join(', ')}` : 'Strong skills match'}</span><a className="plain-button" href={job.url} target="_blank" rel="noreferrer">View job <ArrowUpRight size={14} /></a></div></div>)}</div><aside className="jobs-aside panel"><h2>Your job profile</h2><p>Upload a new resume or use your latest saved resume for matching.</p><div className="preference"><span>Resume</span><strong>{resume ? 'Ready for matching' : 'Not uploaded'}</strong></div><div className="preference"><span>Location</span><strong>{resume?.personal?.location || 'Any location'}</strong></div><div className="preference"><span>Skills</span><strong>{resume ? 'Extracted from resume' : 'Upload to extract'}</strong></div></aside></div></div>
}
