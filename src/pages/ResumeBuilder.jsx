import { useState } from 'react'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { Download, Plus, Printer, Save, Trash2 } from 'lucide-react'
import { saveResume } from '../services/resumeService.js'

const emptyResume = {
  personal: { name: '', role: '', email: '', phone: '', location: '', linkedin: '', github: '', leetcode: '', codeforces: '' },
  summary: '',
  experience: [{ company: '', title: '', dates: '', bullets: [''] }],
  projects: [{ name: '', technologies: '', url: '', description: '' }],
  education: [{ school: '', degree: '', dates: '', score: '' }],
  technicalSkills: { programmingLanguages: [], frontend: [], backend: [], databases: [], tools: [], cloud: [] },
  codingProfiles: [{ platform: 'LeetCode', username: '', url: '' }, { platform: 'Codeforces', username: '', url: '' }],
  softSkills: [],
  achievements: [''],
  certifications: [{ name: '', issuer: '', date: '' }],
  sectionOrder: ['summary', 'codingProfiles', 'experience', 'projects', 'education', 'technicalSkills', 'softSkills', 'achievements', 'certifications'],
}

function updateList(setResume, section, index, field, value) {
  setResume((current) => ({ ...current, [section]: current[section].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }))
}

const skillGroups = [['programmingLanguages', 'Programming languages'], ['frontend', 'Frontend'], ['backend', 'Backend'], ['databases', 'Databases'], ['tools', 'Tools'], ['cloud', 'Cloud / DevOps']]
const sectionLabels = { summary: 'Professional summary', codingProfiles: 'Coding profiles', experience: 'Experience', projects: 'Projects', education: 'Education', technicalSkills: 'Technical skills', softSkills: 'Soft skills', achievements: 'Achievements', certifications: 'Certifications' }

function profileHref(value) {
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function formatTechnologies(value) {
  return String(value || '').split(/[,\n|]+/).map((item) => item.trim()).filter(Boolean).join(' | ')
}

function descriptionBullets(value) {
  return String(value || '').split('\n').map((item) => item.trim()).filter(Boolean)
}

function getCodingProfiles(resume) {
  const profiles = [...(resume.codingProfiles || [])]
  if (resume.personal?.leetcode && !profiles.some((profile) => profile.platform.toLowerCase() === 'leetcode')) profiles.push({ platform: 'LeetCode', username: '', url: resume.personal.leetcode })
  if (resume.personal?.codeforces && !profiles.some((profile) => profile.platform.toLowerCase() === 'codeforces')) profiles.push({ platform: 'Codeforces', username: '', url: resume.personal.codeforces })
  return profiles.filter((profile) => profile.username || profile.url)
}

function hasResumeSection(resume, section) {
  if (section === 'summary') return Boolean(resume.summary.trim())
  if (section === 'codingProfiles') return getCodingProfiles(resume).length > 0
  if (section === 'experience') return resume.experience.some((item) => item.company || item.title || item.bullets.some(Boolean))
  if (section === 'projects') return resume.projects.some((item) => item.name || item.technologies || item.url || item.description)
  if (section === 'education') return resume.education.some((item) => item.school || item.degree || item.dates)
  if (section === 'technicalSkills') return Object.values(resume.technicalSkills).some((group) => group.length)
  if (section === 'softSkills') return resume.softSkills.some(Boolean)
  if (section === 'achievements') return resume.achievements.some(Boolean)
  if (section === 'certifications') return resume.certifications.some((item) => item.name || item.issuer)
  return false
}

function addTag(setResume, section, group, value, setter) {
  const clean = value.trim()
  if (!clean) return
  setResume((current) => ({ ...current, [section]: { ...current[section], [group]: [...current[section][group], clean] } }))
  setter('')
}

function SkillCategory({ group, label, skills, setResume }) {
  const [value, setValue] = useState('')
  return <div className="skill-category"><strong>{label}</strong><div className="tag-editor">{skills.map((skill) => <span key={skill}>{skill}<button aria-label={`Remove ${skill}`} onClick={() => setResume((current) => ({ ...current, technicalSkills: { ...current.technicalSkills, [group]: current.technicalSkills[group].filter((item) => item !== skill) } }))}><Trash2 size={11} /></button></span>)}<input value={value} placeholder="Add skill + Enter" onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(setResume, 'technicalSkills', group, value, setValue) } }} /></div></div>
}

function sectionLines(resume, section) {
  if (!hasResumeSection(resume, section)) return []
  if (section === 'summary') return [new Paragraph({ text: 'SUMMARY', heading: HeadingLevel.HEADING_1 }), new Paragraph(resume.summary)]
  if (section === 'codingProfiles') return [new Paragraph({ text: 'CODING PROFILES', heading: HeadingLevel.HEADING_1 }), ...getCodingProfiles(resume).map((profile) => new Paragraph(`${profile.platform}: ${profile.username}${profile.url ? ` | ${profile.url}` : ''}`))]
  if (section === 'experience') {
    const entries = (resume.experience || []).filter((item) => item.company || item.title || item.bullets.some(Boolean)).flatMap((item) => [
      new Paragraph({ children: [new TextRun({ text: item.title, bold: true }), new TextRun(` | ${item.company} | ${item.dates}`)] }),
      ...(item.bullets || []).filter(Boolean).map((bullet) => new Paragraph({ text: bullet, bullet: { level: 0 } })),
    ])
    return [new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_1 }), ...entries]
  }
  if (section === 'projects') return [new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_1 }), ...resume.projects.filter((item) => item.name || item.technologies || item.url || item.description).flatMap((item) => [new Paragraph({ children: [new TextRun({ text: item.name, bold: true })] }), ...(formatTechnologies(item.technologies) ? [new Paragraph(`Technologies: ${formatTechnologies(item.technologies)}`)] : []), ...descriptionBullets(item.description).map((bullet) => new Paragraph({ text: bullet, bullet: { level: 0 } })), ...(item.url ? [new Paragraph(`Project URL: ${item.url}`)] : [])])]
  if (section === 'education') return [new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_1 }), ...(resume.education || []).filter((item) => item.school || item.degree || item.dates || item.score).map((item) => new Paragraph(`${item.degree} | ${item.school} | ${item.dates}${item.score ? ` | Score: ${item.score}` : ''}`))]
  if (section === 'technicalSkills') return [new Paragraph({ text: 'TECHNICAL SKILLS', heading: HeadingLevel.HEADING_1 }), ...skillGroups.map(([key, label]) => resume.technicalSkills[key].length ? new Paragraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(resume.technicalSkills[key].join(', '))] }) : null).filter(Boolean)]
  if (section === 'softSkills') return [new Paragraph({ text: 'SOFT SKILLS', heading: HeadingLevel.HEADING_1 }), ...resume.softSkills.filter(Boolean).map((skill) => new Paragraph({ text: skill, bullet: { level: 0 } }))]
  if (section === 'achievements') return [new Paragraph({ text: 'ACHIEVEMENTS', heading: HeadingLevel.HEADING_1 }), ...resume.achievements.filter(Boolean).map((item) => new Paragraph({ text: item, bullet: { level: 0 } }))]
  return [new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_1 }), ...resume.certifications.filter((item) => item.name || item.issuer).map((item) => new Paragraph(`${item.name} | ${item.issuer} | ${item.date}`))]
}

function resumeLines(resume) {
  const contact = [resume.personal?.email, resume.personal?.phone, resume.personal?.location, resume.personal?.linkedin, resume.personal?.github, resume.personal?.leetcode, resume.personal?.codeforces].filter(Boolean).join(' | ')
  return [
    new Paragraph({ text: resume.personal?.name || 'Resume', heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: resume.personal?.role || '', bold: true }), new TextRun(` | ${contact}`)] }),
    ...(resume.sectionOrder || Object.keys(sectionLabels)).flatMap((section) => sectionLines(resume, section)),
  ]
}

async function downloadDocx(resume) {
  const documentFile = new Document({ sections: [{ properties: {}, children: resumeLines(resume) }] })
  const blob = await Packer.toBlob(documentFile)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `${resume.personal?.name || 'resume'}.docx`; link.click(); URL.revokeObjectURL(url)
}

function Section({ title, children, action }) {
  return <section className="editor-section"><div className="section-heading"><h2>{title}</h2>{action}</div>{children}</section>
}

function ResumePreview({ resume }) {
  if (resume.sectionOrder) return <OrderedResumePreview resume={resume} />
  const skills = Object.values(resume.technicalSkills || {}).flat().filter(Boolean)
  return <section className="resume-template-preview"><div className="template-label"><span>ATS-friendly template</span><small>Standard headings · single column · text-based</small></div><article className="resume-paper ats-paper"><header><h2>{resume.personal.name || 'Your Name'}</h2><strong>{resume.personal.role || 'Professional title'}</strong><p>{[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.linkedin].filter(Boolean).join(' | ') || 'email@example.com | City, Country'}</p></header>{resume.summary && <PaperBlock title="Summary"><p>{resume.summary}</p></PaperBlock>}{resume.codingProfiles?.some((profile) => profile.username || profile.url) && <PaperBlock title="Coding Profiles">{resume.codingProfiles.filter((profile) => profile.username || profile.url).map((profile) => <p key={`${profile.platform}-${profile.username}`}><b>{profile.platform}:</b> {profile.username} {profile.url && `| ${profile.url}`}</p>)}</PaperBlock>}<PaperBlock title="Experience">{resume.experience.filter((item) => item.company || item.title).map((item, index) => <div className="template-entry" key={index}><div><b>{item.title || 'Role'}</b><span>{item.company} | {item.dates}</span></div><ul>{item.bullets.filter(Boolean).map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul></div>)}</PaperBlock>{resume.education.some((item) => item.school || item.degree) && <PaperBlock title="Education">{resume.education.filter((item) => item.school || item.degree).map((item, index) => <p key={index}><b>{item.degree}</b> | {item.school} | {item.dates}</p>)}</PaperBlock>}{skills.length > 0 && <PaperBlock title="Technical Skills">{skillGroups.map(([key, label]) => resume.technicalSkills[key].length > 0 && <p key={key}><b>{label}:</b> {resume.technicalSkills[key].join(', ')}</p>)}</PaperBlock>}{resume.achievements.some(Boolean) && <PaperBlock title="Achievements"><ul>{resume.achievements.filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}</ul></PaperBlock>}{resume.certifications.some((item) => item.name) && <PaperBlock title="Certifications">{resume.certifications.filter((item) => item.name).map((item, index) => <p key={index}><b>{item.name}</b> | {item.issuer} | {item.date}</p>)}</PaperBlock>}</article></section>
}

function OrderedResumePreview({ resume }) {
  return <section className="resume-template-preview"><div className="template-label"><span>ATS-friendly template</span><small>Standard headings · single column · empty sections omitted</small></div><article className="resume-paper ats-paper"><header><h2>{resume.personal.name || 'Your Name'}</h2><strong>{resume.personal.role || 'Professional title'}</strong><p>{[resume.personal.email, resume.personal.phone, resume.personal.location].filter(Boolean).join(' | ') || 'email@example.com | City, Country'}</p><div className="profile-links">{[['LinkedIn', resume.personal.linkedin], ['GitHub', resume.personal.github], ['LeetCode', resume.personal.leetcode], ['Codeforces', resume.personal.codeforces]].filter(([, value]) => value).map(([label, value]) => <a key={label} href={profileHref(value)} target="_blank" rel="noreferrer">{label}</a>)}</div></header>{resume.sectionOrder.filter((section) => hasResumeSection(resume, section)).map((section) => <OrderedPaperSection key={section} section={section} resume={resume} />)}</article></section>
}

function OrderedPaperSection({ section, resume }) {
  if (section === 'summary') return <PaperBlock title="Summary"><p>{resume.summary}</p></PaperBlock>
  if (section === 'codingProfiles') return <PaperBlock title="Coding Profiles">{getCodingProfiles(resume).map((profile) => <p key={`${profile.platform}-${profile.username}`}><b>{profile.platform}:</b> {profile.username} {profile.url && `| ${profile.url}`}</p>)}</PaperBlock>
  if (section === 'experience') return <PaperBlock title="Experience">{resume.experience.filter((item) => item.company || item.title || item.bullets.some(Boolean)).map((item, index) => <div className="template-entry" key={index}><div><b>{item.title || 'Role'}</b><span>{item.company} | {item.dates}</span></div><ul>{item.bullets.filter(Boolean).map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul></div>)}</PaperBlock>
  if (section === 'projects') return <PaperBlock title="Projects">{resume.projects.filter((item) => item.name || item.technologies || item.url || item.description).map((item, index) => <div className="template-entry" key={index}><div className="project-heading"><b>{item.name || 'Project'}</b>{formatTechnologies(item.technologies) && <span>Technologies: {formatTechnologies(item.technologies)}</span>}</div><ul>{descriptionBullets(item.description).map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul>{item.url && <a href={profileHref(item.url)} target="_blank" rel="noreferrer">View project</a>}</div>)}</PaperBlock>
  if (section === 'education') return <PaperBlock title="Education">{resume.education.filter((item) => item.school || item.degree || item.dates || item.score).map((item, index) => <p key={index}><b>{item.degree}</b> | {item.school} | {item.dates}{item.score && ` | Score: ${item.score}`}</p>)}</PaperBlock>
  if (section === 'technicalSkills') return <PaperBlock title="Technical Skills">{skillGroups.map(([key, label]) => resume.technicalSkills[key].length > 0 && <p key={key}><b>{label}:</b> {resume.technicalSkills[key].join(', ')}</p>)}</PaperBlock>
  if (section === 'softSkills') return <PaperBlock title="Soft Skills"><ul>{resume.softSkills.filter(Boolean).map((skill, index) => <li key={index}>{skill}</li>)}</ul></PaperBlock>
  if (section === 'achievements') return <PaperBlock title="Achievements"><ul>{resume.achievements.filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}</ul></PaperBlock>
  return <PaperBlock title="Certifications">{resume.certifications.filter((item) => item.name || item.issuer).map((item, index) => <p key={index}><b>{item.name}</b> | {item.issuer} | {item.date}</p>)}</PaperBlock>
}

function PaperBlock({ title, children }) {
  return <section className="template-block"><h3>{title}</h3>{children}</section>
}

export default function ResumeBuilder() {
  const [resume, setResume] = useState(emptyResume)
  const [softSkillInput, setSoftSkillInput] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function updatePersonal(field, value) { setResume((current) => ({ ...current, personal: { ...current.personal, [field]: value } })) }
  function updateCodingProfile(index, field, value) { setResume((current) => ({ ...current, codingProfiles: current.codingProfiles.map((profile, profileIndex) => profileIndex === index ? { ...profile, [field]: value } : profile) })) }
  function moveSection(index, direction) { setResume((current) => { const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= current.sectionOrder.length) return current; const sectionOrder = [...current.sectionOrder]; [sectionOrder[index], sectionOrder[nextIndex]] = [sectionOrder[nextIndex], sectionOrder[index]]; return { ...current, sectionOrder } }) }
  async function save() {
    setBusy(true); setMessage('')
    try { await saveResume({ name: resume.personal.name || 'Untitled resume', data: resume, template_id: 'clean' }); setMessage('Resume saved to your workspace.') } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <div className="editor-page"><div className="editor-toolbar"><div><p className="eyebrow">Resume maker</p><h1>{resume.personal.name || 'Untitled resume'}</h1></div><div className="editor-actions"><button className="secondary-button" onClick={() => window.print()}><Printer size={16} />Save PDF</button><button className="secondary-button" onClick={() => downloadDocx(resume)}><Download size={16} />Save DOCX</button><button className="primary-button" onClick={save} disabled={busy}><Save size={16} />{busy ? 'Saving...' : 'Save resume'}</button></div></div><div className="builder-page">
    <Section title="Personal information"><div className="form-grid">{[['name','Full name'],['role','Professional title'],['email','Email'],['phone','Phone'],['location','Location'],['linkedin','LinkedIn URL'],['github','GitHub profile URL'],['leetcode','LeetCode profile URL'],['codeforces','Codeforces profile URL']].map(([field, label]) => <label key={field}>{label}<input value={resume.personal[field]} placeholder={['linkedin', 'github', 'leetcode', 'codeforces'].includes(field) ? 'https://...' : ''} onChange={(event) => updatePersonal(field, event.target.value)} /></label>)}</div></Section>
    <Section title="Professional summary"><textarea className="builder-textarea" rows="5" value={resume.summary} onChange={(event) => setResume((current) => ({ ...current, summary: event.target.value }))} placeholder="Describe your experience and the value you bring." /></Section>
    <Section title="Experience" action={<button className="plain-button" onClick={() => setResume((current) => ({ ...current, experience: [...current.experience, { company: '', title: '', dates: '', bullets: [''] }] }))}><Plus size={14} />Add experience</button>}>{resume.experience.map((item, index) => <div className="builder-item" key={index}><div className="form-grid"><label>Company<input value={item.company} onChange={(event) => updateList(setResume, 'experience', index, 'company', event.target.value)} /></label><label>Title<input value={item.title} onChange={(event) => updateList(setResume, 'experience', index, 'title', event.target.value)} /></label><label>Dates<input value={item.dates} onChange={(event) => updateList(setResume, 'experience', index, 'dates', event.target.value)} /></label></div><label className="field-label">Achievements and responsibilities<textarea rows="4" value={item.bullets.join('\n')} onChange={(event) => updateList(setResume, 'experience', index, 'bullets', event.target.value.split('\n'))} /></label></div>)}</Section>
    <Section title="Projects" action={<button className="plain-button" onClick={() => setResume((current) => ({ ...current, projects: [...current.projects, { name: '', technologies: '', url: '', description: '' }] }))}><Plus size={14} />Add project</button>}>{resume.projects.map((item, index) => <div className="builder-item" key={index}><div className="form-grid"><label>Project name<input value={item.name} placeholder="Campus placement portal" onChange={(event) => updateList(setResume, 'projects', index, 'name', event.target.value)} /></label><label>Technologies<input value={item.technologies} placeholder="React, Node.js, PostgreSQL" onChange={(event) => updateList(setResume, 'projects', index, 'technologies', event.target.value)} /></label><label>Project URL<input value={item.url} placeholder="https://github.com/..." onChange={(event) => updateList(setResume, 'projects', index, 'url', event.target.value)} /></label></div><label className="field-label">Project description<textarea rows="4" value={item.description} placeholder="One project point per line." onChange={(event) => updateList(setResume, 'projects', index, 'description', event.target.value)} /></label></div>)}</Section>
    <Section title="Education" action={<button className="plain-button" onClick={() => setResume((current) => ({ ...current, education: [...current.education, { school: '', degree: '', dates: '', score: '' }] }))}><Plus size={14} />Add education</button>}>{resume.education.map((item, index) => <div className="builder-item" key={index}><div className="form-grid"><label>School<input value={item.school} onChange={(event) => updateList(setResume, 'education', index, 'school', event.target.value)} /></label><label>Degree<input value={item.degree} onChange={(event) => updateList(setResume, 'education', index, 'degree', event.target.value)} /></label><label>Dates<input value={item.dates} onChange={(event) => updateList(setResume, 'education', index, 'dates', event.target.value)} /></label><label>Score / CGPA / Percentage<input value={item.score || ''} placeholder="8.5 CGPA or 85%" onChange={(event) => updateList(setResume, 'education', index, 'score', event.target.value)} /></label></div></div>)}</Section>
    <Section title="Coding profiles" action={<button className="plain-button" onClick={() => setResume((current) => ({ ...current, codingProfiles: [...current.codingProfiles, { platform: '', username: '', url: '' }] }))}><Plus size={14} />Add profile</button>}>{resume.codingProfiles.map((profile, index) => <div className="builder-item" key={index}><div className="form-grid coding-profile-grid"><label>Platform<input value={profile.platform} placeholder="LeetCode" onChange={(event) => updateCodingProfile(index, 'platform', event.target.value)} /></label><label>Username / handle<input value={profile.username} placeholder="your-handle" onChange={(event) => updateCodingProfile(index, 'username', event.target.value)} /></label><label>Profile URL<input value={profile.url} placeholder="https://..." onChange={(event) => updateCodingProfile(index, 'url', event.target.value)} /></label></div></div>)}</Section>
    <Section title="Technical skills"><div className="skills-category-grid">{skillGroups.map(([group, label]) => <SkillCategory key={group} group={group} label={label} skills={resume.technicalSkills[group]} setResume={setResume} />)}</div></Section>
    <Section title="Soft skills"><div className="tag-editor">{resume.softSkills.map((skill) => <span key={skill}>{skill}<button onClick={() => setResume((current) => ({ ...current, softSkills: current.softSkills.filter((item) => item !== skill) }))}><Trash2 size={11} /></button></span>)}<input value={softSkillInput} placeholder="Add communication, leadership..." onChange={(event) => setSoftSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); const clean = softSkillInput.trim(); if (clean) { setResume((current) => ({ ...current, softSkills: [...current.softSkills, clean] })); setSoftSkillInput('') } } }} /></div></Section>
    <Section title="Achievements"><textarea className="builder-textarea" rows="4" value={resume.achievements.join('\n')} onChange={(event) => setResume((current) => ({ ...current, achievements: event.target.value.split('\n') }))} placeholder="One achievement per line, preferably with measurable impact." /></Section>
    <Section title="Certifications" action={<button className="plain-button" onClick={() => setResume((current) => ({ ...current, certifications: [...current.certifications, { name: '', issuer: '', date: '' }] }))}><Plus size={14} />Add certification</button>}>{resume.certifications.map((item, index) => <div className="builder-item" key={index}><div className="form-grid"><label>Certification<input value={item.name} onChange={(event) => updateList(setResume, 'certifications', index, 'name', event.target.value)} /></label><label>Issuer<input value={item.issuer} onChange={(event) => updateList(setResume, 'certifications', index, 'issuer', event.target.value)} /></label><label>Date<input value={item.date} onChange={(event) => updateList(setResume, 'certifications', index, 'date', event.target.value)} /></label></div></div>)}</Section>
    <Section title="Resume section order"><p className="section-help">Choose the order used in the preview, PDF, and DOCX. Empty sections are skipped automatically.</p><div className="section-order-list">{resume.sectionOrder.map((section, index) => <div className="section-order-item" key={section}><span>{index + 1}</span><strong>{sectionLabels[section]}</strong><div><button className="plain-icon" aria-label={`Move ${sectionLabels[section]} earlier`} disabled={index === 0} onClick={() => moveSection(index, -1)}>↑</button><button className="plain-icon" aria-label={`Move ${sectionLabels[section]} later`} disabled={index === resume.sectionOrder.length - 1} onClick={() => moveSection(index, 1)}>↓</button></div></div>)}</div></Section>
    {message && <p className="auth-message">{message}</p>}
    <ResumePreview resume={resume} />
  </div></div>
}
