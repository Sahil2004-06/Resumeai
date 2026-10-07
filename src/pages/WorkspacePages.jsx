import { useEffect, useState } from 'react'
import { Search, Sparkles, WandSparkles } from 'lucide-react'
import { analyzeJob, tailorResume } from '../services/aiService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { extractDocumentText } from '../lib/documentParser.js'
import { listResumes } from '../services/resumeService.js'
import { searchJobsForResume } from '../services/jobsService.js'
import { calculateAtsScore } from '../lib/ats.js'

function ToolPage({ eyebrow, title, description, children }) {
  return <div className="page tool-page"><div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="heading-copy">{description}</p></div></div>{children}</div>
}

export function WorkspaceDashboard() {
  const { user } = useAuth()
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
  const [analytics, setAnalytics] = useState({ totalResumes: null, latestAts: null, jobMatches: null, applicationsReady: null })

  const loadAnalytics = async () => {
    try {
      const savedResumes = await listResumes()
      const rows = Array.isArray(savedResumes) ? savedResumes : []
      const latest = rows[0]?.data || rows[0]
      let latestAts = null
      let applicationsReady = 0

      rows.forEach((row) => {
        try {
          if (calculateAtsScore(row.data || row).score >= 80) applicationsReady += 1
        } catch {
          // An incomplete saved resume should not prevent the other cards from loading.
        }
      })

      if (latest) {
        latestAts = calculateAtsScore(latest).score
      }

      let jobMatches = 0
      if (latest) {
        const result = await searchJobsForResume(latest)
        jobMatches = Array.isArray(result?.jobs) ? result.jobs.length : 0
      }

      setAnalytics({ totalResumes: rows.length, latestAts, jobMatches, applicationsReady })
    } catch (error) {
      console.error('Could not load workspace analytics', error)
      setAnalytics({ totalResumes: 0, latestAts: null, jobMatches: 0, applicationsReady: 0 })
    }
  }

  useEffect(() => {
    const initialRefresh = setTimeout(loadAnalytics, 0)
    const refresh = setInterval(loadAnalytics, 30000)
    return () => {
      clearTimeout(initialRefresh)
      clearInterval(refresh)
    }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const value = (number) => number === null ? '—' : number

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">{today}</p><h1>{greeting}, {displayName} <span className="wave">✦</span></h1><p className="heading-copy">Your workspace, updated with your latest resume activity.</p></div></div><section className="stats-grid"><div className="stat-card"><div className="stat-top"><span>Total resumes</span><span className="stat-dot" /></div><div className="stat-value">{value(analytics.totalResumes)}</div><p>Saved in your workspace.</p></div><div className="stat-card"><div className="stat-top"><span>Latest ATS score</span><span className="stat-dot" /></div><div className="stat-value">{value(analytics.latestAts)}<small>/100</small></div><p>Calculated from your latest resume.</p></div><div className="stat-card"><div className="stat-top"><span>Job matches</span><span className="stat-dot" /></div><div className="stat-value">{value(analytics.jobMatches)}</div><p>Live matches for your latest resume.</p></div><div className="stat-card"><div className="stat-top"><span>Applications ready</span><span className="stat-dot" /></div><div className="stat-value">{value(analytics.applicationsReady)}</div><p>Resumes with an ATS score of 80+.</p></div></section><section className="panel"><div className="panel-heading"><div><h2>Welcome to your workspace</h2><p>Your analytics refresh automatically every 30 seconds after resume changes.</p></div></div></section></div>
}

export function LiveAITailor() {
  const [resumeText, setResumeText] = useState('Product-minded software engineer with experience building React products.')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function loadFile(file, setter) { if (!file) return; try { setter(await extractDocumentText(file)) } catch (error) { setMessage(error.message) } }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setResult(null)
    try { setResult(await tailorResume({ summary: resumeText }, jobDescription)) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <ToolPage eyebrow="Workspace / AI tailor" title="Tailor your resume" description="Upload your resume and the target job description, then generate grounded suggestions."><form className="tool-grid" onSubmit={submit}><section className="panel form-panel"><label className="field-label">Upload resume<input type="file" accept=".pdf,.docx,.txt,.md" onChange={(event) => loadFile(event.target.files?.[0], setResumeText)} /></label><label className="field-label">Resume text<textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} rows="6" /></label><label className="field-label">Upload job description<input type="file" accept=".pdf,.docx,.txt,.md" onChange={(event) => loadFile(event.target.files?.[0], setJobDescription)} /></label><label className="field-label">Job description<textarea required minLength="30" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the job description here..." rows="10" /></label>{message && <p className="auth-message">{message}</p>}<button className="primary-button full" disabled={busy}><WandSparkles size={16} />{busy ? 'Analyzing...' : 'Tailor my resume'}</button></section><section className="panel suggestion-panel"><div className="section-heading"><h2>AI suggestions</h2><span className="status-pill">{result ? 'Ready' : 'Waiting for input'}</span></div>{result ? <pre className="result-output">{JSON.stringify(result.data || result, null, 2)}</pre> : <div className="empty-tool"><Sparkles size={22} /><strong>Your suggestions will appear here</strong><p>Run the secure Gemini-powered analysis.</p></div>}</section></form></ToolPage>
}

export function LiveJobAnalyzer() {
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setResult(null)
    try { setResult(await analyzeJob(description, title, company)) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <ToolPage eyebrow="Workspace / Job analyzer" title="Understand the role" description="Turn a job description into a clear, actionable checklist."><form className="tool-grid" onSubmit={submit}><section className="panel form-panel"><label className="field-label">Company<input value={company} onChange={(event) => setCompany(event.target.value)} /></label><label className="field-label">Role title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="field-label">Description<textarea required minLength="30" rows="12" value={description} onChange={(event) => setDescription(event.target.value)} /></label>{message && <p className="auth-message">{message}</p>}<button className="primary-button full" disabled={busy}><Search size={16} />{busy ? 'Analyzing...' : 'Analyze job'}</button></section><section className="panel analysis-panel"><div className="section-heading"><h2>Role breakdown</h2><span className="status-pill">{result ? 'Ready' : 'Waiting for input'}</span></div>{result ? <pre className="result-output">{JSON.stringify(result.data || result, null, 2)}</pre> : <div className="empty-tool"><Sparkles size={22} /><strong>Analysis will appear here</strong></div>}</section></form></ToolPage>
}
