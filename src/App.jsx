/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, BriefcaseBusiness, ChevronRight, FileText, LayoutDashboard, LogOut, MoreHorizontal, Plus, Search, Settings, Sparkles, Upload, WandSparkles, X } from 'lucide-react'
import AuthPage from './pages/AuthPage.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { LiveAITailor, LiveJobAnalyzer, WorkspaceDashboard } from './pages/WorkspacePages.jsx'
import ResumeBuilder from './pages/ResumeBuilder.jsx'
import Jobs from './pages/JobsPageWithUpload.jsx'
import { searchJobs, searchJobsForResume } from './services/jobsService.js'
import { analyzeJob, analyzeResume } from './services/aiService.js'
import { deleteResume, listResumes, saveResume } from './services/resumeService.js'
import { extractDocumentText } from './lib/documentParser.js'
import { calculateAtsScore } from './lib/ats.js'
import './App.css'

function LegacyJobs() { return <Jobs /> }

const resume = { personal: { name: 'Jordan Lee', role: 'Product-minded Software Engineer', email: 'jordan.lee@email.com', phone: '(415) 555-0182', location: 'San Francisco, CA', linkedin: 'linkedin.com/in/jordanlee' }, summary: 'Software engineer who turns complex product problems into clear, reliable experiences. Four years building thoughtful web products across the stack.', experience: [{ company: 'Northstar Labs', title: 'Software Engineer', dates: '2022 — Present', bullets: ['Built React workflows used by 18k+ monthly users.', 'Partnered with design and product to ship a 34% faster onboarding flow.'] }, { company: 'Grove Digital', title: 'Frontend Engineer', dates: '2020 — 2022', bullets: ['Created accessible interfaces for a growing B2B platform.', 'Introduced component patterns that reduced delivery time across the team.'] }], education: 'B.S. Computer Science · University of California, Davis', skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript', 'AWS', 'Figma'] }
const jobs = [{ title: 'Senior Frontend Engineer', company: 'Linear', location: 'Remote · North America', score: 94, skills: ['React', 'TypeScript', 'GraphQL'], color: 'coral' }, { title: 'Product Engineer', company: 'Arcade', location: 'San Francisco, CA', score: 89, skills: ['React', 'Node.js', 'Postgres'], color: 'lavender' }, { title: 'Software Engineer, Growth', company: 'Notion', location: 'Remote · US', score: 82, skills: ['JavaScript', 'AWS', 'SQL'], color: 'mint' }]

export default function App() { return <BrowserRouter><AppShell /></BrowserRouter> }

function AppShell() {
  const location = useLocation(); const navigate = useNavigate(); const [showCreate, setShowCreate] = useState(false); const [showUpgrade, setShowUpgrade] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [mobileNav, setMobileNav] = useState(false)
  const { session, user, loading, signOut: signOutSession } = useAuth()
  const isDemoMode = import.meta.env.DEV
  const effectiveSession = session || (isDemoMode ? { user: { user_metadata: { full_name: 'Demo User' }, email: 'demo@resumeai.local' } } : null)
  const effectiveUser = effectiveSession?.user || user || null

  async function handleSignOut() {
    try {
      if (session) await signOutSession()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }
  if (location.pathname === '/login') return <AuthPage mode="login" />
  if (location.pathname === '/signup') return <AuthPage mode="signup" />
  if (loading) return <div className="auth-page"><div className="auth-card"><p className="eyebrow">ResumeAI</p><h1>Loading your workspace...</h1></div></div>
  if (!session && !isDemoMode) return <AuthPage mode="login" />
  const displayName = effectiveUser?.user_metadata?.full_name || effectiveUser?.email?.split('@')[0] || 'there'
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  function getGreeting() {
    try {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) return 'Good morning'
      if (hour >= 12 && hour < 17) return 'Good afternoon'
      return 'Good evening'
    } catch {
      return 'Hello'
    }
  }

  const pageTitle = location.pathname.includes('resumes/') ? 'Resume editor' : location.pathname === '/resumes' ? 'My resumes' : location.pathname === '/jobs' ? 'Job matches' : `${getGreeting()}, ${displayName}`
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}><div className="brand"><span className="brand-mark"><Sparkles size={16} /></span><span>resume<span className="brand-accent">ai</span></span></div><div className="profile-mini"><div className="avatar">{initials}</div><div><strong>{displayName}</strong><span>Personal workspace</span></div><ChevronRight size={15} /></div><nav className="nav-group" aria-label="Main navigation"><p className="nav-label">Workspace</p><NavLink to="/" end><LayoutDashboard size={17} />Overview</NavLink><NavLink to="/resumes"><FileText size={17} />My resumes<span className="nav-count">3</span></NavLink><NavLink to="/jobs"><BriefcaseBusiness size={17} />Job matches<span className="nav-count">12</span></NavLink><p className="nav-label nav-label-spaced">Tools</p><NavLink to="/tailor"><WandSparkles size={17} />AI tailor<span className="new-pill">New</span></NavLink><NavLink to="/ats-analyzer"><Search size={17} />ATS analyzer</NavLink></nav><div className="sidebar-bottom"><NavLink to="/settings"><Settings size={17} />Settings</NavLink><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={15} /></div><strong>Make your next move</strong><p>Unlock unlimited AI tailoring.</p><button type="button" onClick={() => setShowUpgrade(true)}>Upgrade plan <ArrowUpRight size={13} /></button></div><div className="sidebar-footer"><span className="avatar avatar-small">{initials}</span><span>Free plan</span><button type="button" aria-label="Sign out" onClick={handleSignOut}><LogOut size={17} /></button></div></div></aside>
    {mobileNav && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content"><header className="topbar"><button className="menu-toggle" aria-label="Open navigation" onClick={() => setMobileNav(true)}><span /><span /><span /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><div className="profile-trigger"><button className="top-avatar" aria-label="Open profile" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>{initials}</button>{profileOpen && <div className="profile-menu"><strong>{displayName}</strong><span>{effectiveUser?.email || 'Personal workspace'}</span><Link to="/settings" onClick={() => setProfileOpen(false)}>Profile settings</Link><button type="button" onClick={handleSignOut}><LogOut size={14} />Log out</button></div>}</div></div></header><Routes><Route path="/" element={<WorkspaceDashboard />} /><Route path="/tailor" element={<LiveAITailor />} /><Route path="/analyzer" element={<LiveJobAnalyzer />} /><Route path="/ats-analyzer" element={<Dashboard onCreate={() => setShowCreate(true)} />} /><Route path="/settings" element={<SettingsPage />} /><Route path="/resumes" element={<ResumeLibrary onCreate={() => setShowCreate(true)} onUpgrade={() => setShowUpgrade(true)} />} /><Route path="/resumes/new" element={<ResumeBuilder />} /><Route path="/resumes/:id/edit" element={<ResumeBuilder />} /><Route path="/jobs" element={<Jobs />} /><Route path="*" element={<WorkspaceDashboard />} /></Routes></main>{showCreate && <CreateResumeModal onClose={() => setShowCreate(false)} />}{showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
  </div>
}

function Dashboard({ onCreate }) {
  // Hooks (must run on every render)
  const loc = useLocation()
  const currentPath = loc.pathname
  const auth = useAuth()
  const effectiveSession = auth.session || null
  const effectiveUser = effectiveSession?.user || auth.user || null

  const [stats, setStats] = useState({ totalResumes: 0, latestAts: null, jobMatches: 0, applicationsReady: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        const saved = await listResumes()
        if (cancelled) return
        const rows = Array.isArray(saved) ? saved : []
        const total = rows.length
        let latestAts = null
        let jobMatches = 0
        let applicationsReady = 0

        if (total > 0) {
          const latestRow = rows[0]
          const latest = latestRow?.data || latestRow
          try { latestAts = calculateAtsScore(latest)?.score ?? null } catch { latestAts = null }

          // applications ready: count resumes with ATS >= 80
          try {
            applicationsReady = rows.reduce((acc, row) => {
              try {
                const r = row.data || row
                const sc = calculateAtsScore(r).score
                return acc + (sc >= 80 ? 1 : 0)
              } catch { return acc }
            }, 0)
          } catch { applicationsReady = 0 }

          // fetch job matches for latest resume
          try {
            const jobsResult = await searchJobsForResume(latest)
            if (!cancelled && jobsResult && Array.isArray(jobsResult.jobs)) jobMatches = jobsResult.jobs.length
          } catch {
            jobMatches = 0
          }
        }

        if (!cancelled) setStats({ totalResumes: total, latestAts, jobMatches, applicationsReady })
      } catch (error) {
        console.error('Failed to load stats', error)
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const greeting = (() => { try { const hour = new Date().getHours(); if (hour >= 5 && hour < 12) return 'Good morning'; if (hour >= 12 && hour < 17) return 'Good afternoon'; return 'Good evening' } catch { return 'Hello' } })()

  if (currentPath === '/login') return <AuthPage mode="login" />
  if (currentPath === '/signup') return <AuthPage mode="signup" />
  if (currentPath === '/tailor') return <AITailor />
  if (currentPath === '/analyzer') return <JobAnalyzer />
  if (currentPath === '/ats-analyzer') return <ATSAnalyzer />
  if (currentPath === '/settings') return <SettingsPage />
  if (currentPath === '/upload-resume') return <UploadResume />
  if (currentPath === '/saved-jobs') return <SavedJobs />

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1>{greeting}, {effectiveUser?.user_metadata?.full_name || effectiveUser?.email?.split('@')[0] || 'there'} <span className="wave">✦</span></h1>
          <p className="heading-copy">Make your next application your strongest one yet.</p>
        </div>
        <button className="primary-button" onClick={onCreate}><Plus size={17} />Create resume</button>
      </div>

      <section className="stats-grid">
        {loadingStats ? (
          <Stat label="Loading" value="—" detail="Fetching your workspace data" />
        ) : (
          <>
            <Stat label="Total resumes" value={String(stats.totalResumes)} detail="Keep your best work ready to share." />
            <Stat label="Latest ATS score" value={stats.latestAts !== null ? String(stats.latestAts) : '—'} detail={stats.latestAts !== null ? 'Improve keyword coverage.' : 'No ATS data yet.'} suffix="/100" />
            <Stat label="Job matches" value={String(stats.jobMatches)} detail="Live job matches for your latest resume." />
            <Stat label="Applications ready" value={String(stats.applicationsReady)} detail="Resumes with ATS ≥ 80" />
          </>
        )}
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your resumes</h2>
              <p>Keep your best work ready to share.</p>
            </div>
            <Link to="/resumes" className="text-link">View all <ArrowUpRight size={15} /></Link>
          </div>

          <div className="resume-list">
            <ResumeRow title="Product Engineer · General" meta="Updated today" score="87" tone="blue" />
            <ResumeRow title="Frontend Engineer · Linear" meta="Updated Sep 18" score="94" tone="coral" />
            <ResumeRow title="Software Engineer · Archive" meta="Updated Sep 02" score="76" tone="gray" />
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Next best action</h2>
              <p>One small improvement goes a long way.</p>
            </div>
          </div>

          <div className="action-callout">
            <div className="action-icon"><WandSparkles size={19} /></div>
            <div>
              <strong>Add 2 missing keywords</strong>
              <p>Your Linear resume is a 94% match. Adding <b>GraphQL</b> and <b>testing</b> could make it even stronger.</p>
              <Link to="/resumes/linear/edit">Review suggestions <ChevronRight size={14} /></Link>
            </div>
          </div>

          <div className="mini-progress">
            <div><span>Profile completeness</span><strong>82%</strong></div>
            <div className="progress-track"><span /></div>
          </div>
        </section>
      </div>

      <section className="panel matches-panel">
        <div className="panel-heading">
          <div><h2>Recommended for you</h2><p>Based on your skills and resume preferences.</p></div>
          <Link to="/jobs" className="text-link">Explore jobs <ArrowUpRight size={15} /></Link>
        </div>
        {jobs.map((job) => <JobRow key={job.title} job={job} />)}
      </section>
    </div>
  )
}
function Stat({ label, value, detail, suffix }) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-dot" /></div><div className="stat-value">{value}<small>{suffix}</small></div><p>{detail}</p></div> }
function ResumeRow({ title, meta, score, tone }) { return <Link to="/resumes/linear/edit" className="resume-row"><div className={`document-icon ${tone}`}><FileText size={20} /></div><div className="resume-row-copy"><strong>{title}</strong><span>{meta}</span></div><div className="score"><strong>{score}</strong><span>ATS score</span></div><ChevronRight size={17} className="row-arrow" /></Link> }
function JobRow({ job }) { return <div className="job-row"><div className={`company-logo ${job.color}`}>{job.company.slice(0, 1)}</div><div className="job-main"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><div className="skill-tags">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div><div className="match-score"><strong>{job.score}%</strong><span>match</span></div><button className="save-button" aria-label={`Save ${job.title}`}><Plus size={17} /></button></div> }
function ResumeLibrary({ onCreate, onUpgrade }) {
  const [resumes, setResumes] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function refreshResumes() {
    try {
      const rows = await listResumes()
      setResumes(Array.isArray(rows) ? rows : [])
    } catch (error) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    const initialRefresh = setTimeout(refreshResumes, 0)
    return () => clearTimeout(initialRefresh)
  }, [])

  async function uploadResume(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const text = await extractDocumentText(file)
      if (text.trim().length < 20) throw new Error('We could not find enough readable text in this file.')
      const parsed = await analyzeResume(text)
      const data = parsed.data || parsed
      await saveResume({ name: data.personal?.name || file.name, data, template_id: 'clean' })
      await refreshResumes()
      setMessage('Resume uploaded successfully.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
      event.target.value = ''
    }

  }

  async function removeResume(id) {
    if (!id || !window.confirm('Delete this resume permanently?')) return
    setMessage('')
    try {
      await deleteResume(id)
      setResumes((current) => current.filter((item) => item.id !== id))
      setMessage('Resume deleted.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Workspace / Resumes</p><h1>My resumes</h1><p className="heading-copy">Your saved resumes, scores, and versions in one place.</p></div><div className="heading-actions"><label className="secondary-button"><Upload size={16} />{busy ? 'Uploading...' : 'Upload'}<input type="file" accept=".pdf,.docx,.txt,.md" hidden disabled={busy} onChange={uploadResume} /></label><button className="primary-button" onClick={onCreate}><Plus size={17} />Create resume</button></div></div>{message && <p className="auth-message">{message}</p>}<div className="filter-bar"><div className="search-field"><Search size={16} /><input placeholder="Search resumes" /></div><span>{resumes.length} resumes</span></div><div className="resume-cards">{resumes.length ? resumes.map((item, index) => { const data = item.data || item; const score = calculateAtsScore(data).score; return <ResumeCard key={item.id || item.name || index} id={item.id} title={item.name || data.personal?.name || 'Untitled resume'} score={String(score)} tone={index % 2 ? 'coral' : 'blue'} updated={item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Recently'} tags={data.skills?.slice?.(0, 2) || Object.values(data.technicalSkills || {}).flat().slice(0, 2)} onDelete={removeResume} /> }) : <div className="panel"><p>No resumes yet. Upload one or create your first resume.</p><button className="text-link" type="button" onClick={onUpgrade}>Explore premium features <ArrowUpRight size={14} /></button></div>}</div></div>
}
function ResumeCard({ id, title, score, tone, updated, tags, onDelete }) { const editPath = id ? `/resumes/${id}/edit` : '/resumes/new'; return <article className="resume-card"><Link to={editPath} className={`resume-card-preview ${tone}`} aria-label={`View ${title}`}><div className="preview-lines"><i /><i /><i /><i /><i /><i /></div><div className="preview-score"><span>{score}</span><small>ATS</small></div></Link><div className="resume-card-body"><div className="card-title-row"><div><h3>{title}</h3><p>Updated {updated}</p></div><button type="button" className="plain-icon" aria-label={`Delete ${title}`} onClick={() => onDelete(id)}><X size={16} /></button></div><div className="card-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="card-actions"><Link to={editPath} className="secondary-button small">View & edit <ChevronRight size={14} /></Link><button className="plain-button" type="button" onClick={() => onDelete(id)}>Delete</button></div></div></article> }
function ResumeEditor() { const [zoom, setZoom] = useState(90); return <div className="editor-page"><div className="editor-toolbar"><div><p className="eyebrow">My resumes / Editing</p><h1>Product Engineer · General</h1></div><div className="editor-actions"><span className="saved-status">● Saved just now</span><button className="secondary-button">Download <ChevronRight size={14} /></button><button className="primary-button"><Sparkles size={16} />Tailor with AI</button></div></div><div className="editor-layout"><section className="editor-form"><div className="editor-tabs"><button className="active">Content</button><button>Design</button><button>Versions</button></div><EditorSection title="Personal information"><div className="form-grid"><label>Full name<input defaultValue={resume.personal.name} /></label><label>Headline<input defaultValue={resume.personal.role} /></label><label>Email<input defaultValue={resume.personal.email} /></label><label>Phone<input defaultValue={resume.personal.phone} /></label><label>Location<input defaultValue={resume.personal.location} /></label><label>LinkedIn<input defaultValue={resume.personal.linkedin} /></label></div></EditorSection><EditorSection title="Professional summary" action="Improve with AI"><textarea defaultValue={resume.summary} rows="5" /></EditorSection><EditorSection title="Experience" action="+ Add experience">{resume.experience.map((item) => <div className="experience-item" key={item.company}><div className="experience-header"><div><strong>{item.title}</strong><span>{item.company} · {item.dates}</span></div><MoreHorizontal size={18} /></div>{item.bullets.map((bullet) => <div className="bullet-input" key={bullet}><span>•</span><input defaultValue={bullet} /></div>)}</div>)}</EditorSection><EditorSection title="Skills"><div className="editable-tags">{resume.skills.map((skill) => <span key={skill}>{skill}<X size={12} /></span>)}<button>+ Add skill</button></div></EditorSection></section><section className="preview-column"><div className="preview-toolbar"><span>Live preview</span><div className="zoom-controls">{[75, 90, 100, 110].map((value) => <button className={zoom === value ? 'active' : ''} onClick={() => setZoom(value)} key={value}>{value}%</button>)}</div></div><div className="paper-wrap"><article className="resume-paper" style={{ transform: `scale(${zoom / 100})` }}><div className="paper-header"><h2>{resume.personal.name}</h2><h3>{resume.personal.role}</h3><p>{resume.personal.email} · {resume.personal.phone} · {resume.personal.location}</p><p>{resume.personal.linkedin}</p></div><PaperSection title="Summary"><p>{resume.summary}</p></PaperSection><PaperSection title="Experience">{resume.experience.map((item) => <div key={item.company} className="paper-experience"><div><strong>{item.title}</strong><span>{item.company} · {item.dates}</span></div><ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div>)}</PaperSection><PaperSection title="Education"><p>{resume.education}</p></PaperSection><PaperSection title="Skills"><p>{resume.skills.join('  ·  ')}</p></PaperSection></article></div></section></div></div> }
function EditorSection({ title, action, children }) { return <div className="editor-section"><div className="section-heading"><h2>{title}</h2>{action && <button>{action}</button>}</div>{children}</div> }
function PaperSection({ title, children }) { return <section className="paper-section"><h4>{title}</h4>{children}</section> }
function LegacyJobsContent() { const [query, setQuery] = useState(''); const [result, setResult] = useState({ jobs, configured: false }); const [message, setMessage] = useState(''); async function findJobs(event) { event.preventDefault(); setMessage(''); try { setResult(await searchJobs(query)) } catch (error) { setMessage(error.message) } } return <div className="page"><div className="page-heading"><div><p className="eyebrow">Workspace / Job matches</p><h1>Jobs worth a look</h1><p className="heading-copy">Search jobs through your configured provider.</p></div></div><div className="jobs-layout"><div className="jobs-main"><form className="filter-bar" onSubmit={findJobs}><div className="search-field wide"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, companies, or skills" /></div><button className="primary-button" type="submit">Find jobs</button></form>{message && <p className="auth-message">{message}</p>}{!result.configured && <p className="auth-message">Showing sample listings. Add VITE_JOBS_API_URL to load live jobs from your provider.</p>}{result.jobs.map((job) => <div className="job-detail-card" key={`${job.company}-${job.title}`}><div className="job-row"><div className="company-logo coral">{job.company.slice(0, 1)}</div><div className="job-main"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><div className="skill-tags">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div></div><div className="job-card-footer"><span>Source listing</span><a className="plain-button" href={job.url} target="_blank" rel="noreferrer">View job <ArrowUpRight size={14} /></a></div></div>)}</div><aside className="jobs-aside panel"><h2>Your job preferences</h2><p>Provider results can be filtered by your preferences once connected.</p><div className="preference"><span>Role types</span><strong>Product, Frontend</strong></div><div className="preference"><span>Location</span><strong>Remote, San Francisco</strong></div></aside></div></div> }
function CreateResumeModal({ onClose }) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button><div className="modal-icon"><Sparkles size={22} /></div><p className="eyebrow">Start fresh</p><h2>What are you building?</h2><p className="modal-copy">Choose a starting point. You can always change the content and design later.</p><Link to="/resumes/new" className="choice" onClick={onClose}><span className="choice-icon"><FileText size={18} /></span><span><strong>Build from scratch</strong><small>Start with a clean, ATS-friendly template</small></span><ChevronRight size={17} /></Link><button className="choice"><span className="choice-icon upload"><Upload size={18} /></span><span><strong>Upload an existing resume</strong><small>We’ll extract your content and organize it</small></span><ChevronRight size={17} /></button></div></div> }
function UpgradeModal({ onClose }) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="modal-close" aria-label="Close upgrade dialog" onClick={onClose}><X size={18} /></button><div className="modal-icon"><Sparkles size={22} /></div><p className="eyebrow">ResumeAI plans</p><h2>Make your next move</h2><p className="modal-copy">Upgrade to unlock unlimited AI tailoring, more resume versions, and deeper job matching.</p><button className="primary-button full" type="button" onClick={onClose}>Coming soon — keep me posted</button></div></div> }

function ToolPage({ eyebrow, title, description, children, action }) { return <div className="page tool-page"><div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="heading-copy">{description}</p></div>{action}</div>{children}</div> }
function AITailor() { const [submitted, setSubmitted] = useState(false); return <ToolPage eyebrow="Workspace / AI tailor" title="Tailor your resume" description="Make your experience more relevant without losing your voice."><div className="tool-grid"><section className="panel form-panel"><div className="section-heading"><h2>Choose your inputs</h2><span className="step-label">1 of 2</span></div><label className="field-label">Resume<select defaultValue="general"><option value="general">Product Engineer · General</option><option>Frontend Engineer · Linear</option></select></label><label className="field-label">Job description<textarea placeholder="Paste the job description here..." rows="10" defaultValue="We are looking for a product-minded frontend engineer to build accessible React experiences, collaborate with design, and ship reliable software." /></label><button className="primary-button full" onClick={() => setSubmitted(true)}><WandSparkles size={16} />{submitted ? 'Suggestions ready' : 'Tailor my resume'}</button></section><section className="panel suggestion-panel"><div className="section-heading"><h2>AI suggestions</h2><span className="status-pill">{submitted ? '3 suggestions' : 'Waiting for input'}</span></div>{submitted ? <><Suggestion original="Worked on frontend application." suggested="Built accessible React experiences for a growing product platform." reason="Stronger action verb and clearer technical context." /><Suggestion original="Used different tools to ship features." suggested="Partnered with design to ship reliable product features." reason="Makes the cross-functional collaboration explicit." /><Suggestion original="Skills: JavaScript, React, Node.js" suggested="Skills: React, JavaScript, Node.js, accessibility" reason="Highlights a relevant skill already supported by your experience." /></> : <div className="empty-tool"><Sparkles size={22} /><strong>Your suggestions will appear here</strong><p>Paste a job description and run the analysis. Nothing is applied automatically.</p></div>}</section></div></ToolPage> }
function Suggestion({ original, suggested, reason }) { const [accepted, setAccepted] = useState(false); return <div className={`suggestion ${accepted ? 'accepted' : ''}`}><div><span className="suggestion-label">Original</span><p>{original}</p></div><ChevronRight size={16} /><div><span className="suggestion-label">AI suggestion</span><p>{suggested}</p></div><small>Why: {reason}</small><div className="suggestion-actions"><button className="secondary-button small" onClick={() => setAccepted(true)}>{accepted ? 'Accepted' : 'Accept'}</button><button className="plain-button">Reject</button></div></div> }
function JobAnalyzer() { const [analyzed, setAnalyzed] = useState(false); return <ToolPage eyebrow="Workspace / Job analyzer" title="Understand the role" description="Turn a job description into a clear, actionable checklist."><div className="tool-grid"><section className="panel form-panel"><h2>Job description</h2><label className="field-label">Company<input placeholder="Company name" defaultValue="Linear" /></label><label className="field-label">Role title<input placeholder="Role title" defaultValue="Senior Frontend Engineer" /></label><label className="field-label">Description<textarea rows="12" defaultValue="Build polished product experiences with React and TypeScript. Work with design and product. Experience with GraphQL, testing, and accessibility is a plus." /></label><button className="primary-button full" onClick={() => setAnalyzed(true)}><Search size={16} />{analyzed ? 'Analysis complete' : 'Analyze job'}</button></section><section className="panel analysis-panel"><div className="section-heading"><h2>Role breakdown</h2><span className="status-pill">{analyzed ? 'Ready' : 'Preview'}</span></div><div className="analysis-group"><span>Required skills</span><div className="analysis-tags"><b>React</b><b>TypeScript</b><b>Accessibility</b></div></div><div className="analysis-group"><span>Preferred skills</span><div className="analysis-tags peach-tags"><b>GraphQL</b><b>Testing</b></div></div><div className="analysis-group"><span>Responsibilities</span><ul><li>Build polished product experiences</li><li>Collaborate with design and product</li><li>Write reliable, tested software</li></ul></div></section></div></ToolPage> }
function ATSAnalyzer() {
  const [file, setFile] = useState(null)
  const [jobFile, setJobFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function runAnalysis(event) {
    event.preventDefault()
    if (!file) { setMessage('Upload your resume before running the ATS analysis.'); return }
    setBusy(true); setMessage(''); setAnalysis(null)
    try {
      const text = await extractDocumentText(file)
      if (text.trim().length < 20) throw new Error('We could not find enough readable text in this file.')
      const parsed = await analyzeResume(text)
      let jobAnalysis = {}
      if (jobDescription.trim()) {
        const parsedJob = await analyzeJob(jobDescription.trim(), '', '')
        jobAnalysis = parsedJob.data || parsedJob
      }
      setAnalysis(calculateAtsScore(parsed.data || parsed, jobAnalysis))
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const score = analysis?.score || 0
  return <ToolPage eyebrow="Workspace / ATS analyzer" title="See how your resume reads" description="Upload a resume and optionally compare it with a target job description."><form onSubmit={runAnalysis}><section className="panel upload-panel"><div className="upload-drop"><Upload size={28} /><h2>{file ? file.name : 'Upload your resume first'}</h2><p>PDF, DOCX, TXT, or MD</p><label className="secondary-button">Choose resume<input type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={(event) => { setFile(event.target.files?.[0] || null); setAnalysis(null); setMessage('') }} /></label></div><label className="field-label">Target job description<textarea value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setAnalysis(null) }} placeholder="Paste the job description here for a targeted ATS score..." rows="7" /></label><label className="secondary-button">{jobFile ? `Job description: ${jobFile.name}` : 'Upload job description'}<input type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={async (event) => { const selectedFile = event.target.files?.[0]; if (!selectedFile) return; try { setJobFile(selectedFile); setJobDescription(await extractDocumentText(selectedFile)); setAnalysis(null); setMessage('') } catch (error) { setMessage(error.message) } }} /></label>{message && <p className="auth-message">{message}</p>}<button className="primary-button full" type="submit" disabled={busy || !file}><Sparkles size={16} />{busy ? 'Analyzing resume and job...' : 'Run ATS analysis'}</button></section></form>{analysis && <><section className="panel ats-hero"><div className="score-ring"><strong>{score}</strong><span>/100</span></div><div><h2>{score >= 80 ? 'Strong resume foundation' : 'Your resume needs improvement'}</h2><p>{jobDescription.trim() ? 'This score includes keyword matches from your target job description.' : 'This score is based on readable sections, contact details, and detected resume content.'}</p></div></section><div className="ats-breakdown"><Metric label="Keyword match" value={`${analysis.breakdown.keywordMatch}/40`} width={`${analysis.breakdown.keywordMatch / 40 * 100}%`} /><Metric label="Section completeness" value={`${analysis.breakdown.sectionCompleteness}/30`} width={`${analysis.breakdown.sectionCompleteness / 30 * 100}%`} /><Metric label="Contact details" value={`${analysis.breakdown.contactDetails}/20`} width={`${analysis.breakdown.contactDetails / 20 * 100}%`} /><Metric label="Formatting" value={`${analysis.breakdown.formatting}/10`} width={`${analysis.breakdown.formatting * 10}%`} /></div><section className="panel missing-panel"><div className="section-heading"><h2>Suggested improvements</h2><span className="status-pill">{analysis.missingKeywords.length} missing keywords</span></div>{analysis.missingKeywords.length ? <p>Add relevant terms from the target job description where they truthfully reflect your experience: {analysis.missingKeywords.slice(0, 8).join(', ')}.</p> : <p>Your resume covers the detected keywords well.</p>}</section></>}</ToolPage>
}
function Metric({ label, value, width }) { return <div className="metric"><div><span>{label}</span><strong>{value}</strong></div><div className="metric-track"><span style={{ width }} /></div></div> }
function UploadResume() { const [file, setFile] = useState(null); return <ToolPage eyebrow="Workspace / Upload resume" title="Bring your resume with you" description="Upload a PDF or DOCX and review the extracted content before saving."><section className="panel upload-panel"><div className="upload-drop"><Upload size={28} /><h2>{file ? file.name : 'Drop your resume here'}</h2><p>PDF or DOCX up to 10MB</p><label className="secondary-button">Choose file<input type="file" accept=".pdf,.docx" hidden onChange={(event) => setFile(event.target.files?.[0])} /></label></div>{file && <div className="upload-review"><div><strong>Ready to parse</strong><p>Your file will be sent to the secure resume parsing function for review.</p></div><button className="primary-button">Parse resume <ChevronRight size={15} /></button></div>}</section></ToolPage> }
function SavedJobs() { return <ToolPage eyebrow="Workspace / Saved jobs" title="Jobs to come back to" description="Keep your shortlist close while you decide your next move."><section className="panel saved-list">{jobs.map((job) => <JobRow key={job.title} job={job} />)}</section></ToolPage> }
function SettingsPage() { const [saved, setSaved] = useState(false); const [emailUpdates, setEmailUpdates] = useState(true); const [autoAnalyze, setAutoAnalyze] = useState(true); function saveSettings(event) { event.preventDefault(); setSaved(true) } return <ToolPage eyebrow="Workspace / Settings" title="Your preferences" description="Keep your profile, analysis defaults, and notifications up to date."><form className="panel settings-panel" onSubmit={saveSettings}><EditorSection title="Profile"><div className="form-grid"><label>Full name<input defaultValue="Jordan Lee" /></label><label>Email<input type="email" defaultValue="jordan.lee@email.com" /></label><label>Location<input defaultValue="San Francisco, CA" /></label><label>LinkedIn<input defaultValue="linkedin.com/in/jordanlee" /></label></div></EditorSection><EditorSection title="Resume preferences"><label className="field-label">Default template<select defaultValue="clean"><option value="clean">Clean professional</option><option>Modern engineer</option><option>Minimal technical</option></select></label><label className="field-label">Default role focus<select defaultValue="frontend"><option value="frontend">Frontend engineering</option><option value="product">Product engineering</option><option value="fullstack">Full-stack engineering</option></select></label></EditorSection><EditorSection title="Notifications"><label className="setting-toggle"><input type="checkbox" checked={emailUpdates} onChange={(event) => setEmailUpdates(event.target.checked)} /><span><strong>Weekly job match updates</strong><small>Receive relevant roles and application reminders.</small></span></label><label className="setting-toggle"><input type="checkbox" checked={autoAnalyze} onChange={(event) => setAutoAnalyze(event.target.checked)} /><span><strong>Analyze uploaded resumes automatically</strong><small>Start ATS analysis as soon as a resume is ready.</small></span></label></EditorSection><div className="settings-actions"><button className="primary-button" type="submit">Save settings</button>{saved && <span className="saved-status">Saved just now</span>}</div></form></ToolPage> }