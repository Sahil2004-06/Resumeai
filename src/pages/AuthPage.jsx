import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, Sparkles } from 'lucide-react'
import { supabase } from '../services/supabase'

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const isSignup = mode === 'signup'

  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('')
    if (!supabase) { setMessage('Add Supabase environment variables before using authentication.'); setBusy(false); return }
    const result = isSignup ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }) : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setMessage('Authentication failed. Check your details and try again.')
    else if (isSignup) setMessage('Check your email to confirm your account.')
    else navigate('/', { replace: true })
    setBusy(false)
  }

  return <div className="auth-page"><div className="auth-brand"><span className="brand-mark"><Sparkles size={16} /></span>resume<span className="brand-accent">ai</span></div><div className="auth-card"><Link to="/" className="auth-back"><ArrowLeft size={14} /> Back to workspace</Link><div className="auth-icon"><LockKeyhole size={20} /></div><p className="eyebrow">Your career workspace</p><h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1><p className="auth-copy">{isSignup ? 'Build a sharper resume and find work that fits.' : 'Pick up where you left off.'}</p><form onSubmit={submit}>{isSignup && <label className="field-label">Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jordan Lee" /></label>}<label className="field-label">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label className="field-label">Password<input required minLength="8" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>{message && <p className="auth-message">{message}</p>}<button className="primary-button full" disabled={busy}>{busy ? 'Working...' : isSignup ? 'Create account' : 'Log in'}</button></form><p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to ResumeAI?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link></p></div></div>
}
