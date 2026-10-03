const stringValue = (value) => typeof value === 'string' ? value.trim() : ''
const stringList = (value) => Array.isArray(value) ? value.map(stringValue).filter(Boolean) : []

export function resumeSchema(value) {
  const input = value && typeof value === 'object' ? value : {}
  const personal = input.personal && typeof input.personal === 'object' ? input.personal : {}
  return {
    personal: { name: stringValue(personal.name), email: stringValue(personal.email), phone: stringValue(personal.phone), location: stringValue(personal.location), linkedin: stringValue(personal.linkedin), github: stringValue(personal.github), portfolio: stringValue(personal.portfolio) },
    summary: stringValue(input.summary),
    experience: Array.isArray(input.experience) ? input.experience.map((item) => ({ company: stringValue(item.company), title: stringValue(item.title), location: stringValue(item.location), startDate: stringValue(item.startDate), endDate: stringValue(item.endDate), current: Boolean(item.current), bullets: stringList(item.bullets) })) : [],
    education: Array.isArray(input.education) ? input.education.map((item) => ({ institution: stringValue(item.institution), degree: stringValue(item.degree), field: stringValue(item.field), startDate: stringValue(item.startDate), endDate: stringValue(item.endDate), gpa: stringValue(item.gpa) })) : [],
    skills: stringList(input.skills),
    projects: Array.isArray(input.projects) ? input.projects.map((item) => ({ name: stringValue(item.name), description: stringValue(item.description), technologies: stringList(item.technologies), github: stringValue(item.github), url: stringValue(item.url), bullets: stringList(item.bullets) })) : [],
    certifications: stringList(input.certifications),
    achievements: stringList(input.achievements),
  }
}

export function jobAnalysisSchema(value) {
  const input = value && typeof value === 'object' ? value : {}
  return { jobTitle: stringValue(input.jobTitle), company: stringValue(input.company), requiredSkills: stringList(input.requiredSkills), preferredSkills: stringList(input.preferredSkills), responsibilities: stringList(input.responsibilities), experienceRequirements: stringList(input.experienceRequirements), educationRequirements: stringList(input.educationRequirements), technologies: stringList(input.technologies), softSkills: stringList(input.softSkills), keywords: stringList(input.keywords) }
}

export function parseModelJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(cleaned) } catch { throw new Error('The AI returned invalid structured data.') }
}
