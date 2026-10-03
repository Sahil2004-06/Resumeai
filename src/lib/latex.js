export function escapeLatex(value = '') {
  return String(value).replace(/[&%$#_{}~^\\]/g, (character) => ({ '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', _: '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}', '\\': '\\textbackslash{}' })[character])
}

export function generateLatex(resume, templateId = 'clean') {
  const personal = resume.personal || {}
  const templateMarker = escapeLatex(templateId)
  const experience = (resume.experience || []).map((item) => `\\textbf{${escapeLatex(item.title)}} \\hfill ${escapeLatex(item.dates)}\\\\\\n${escapeLatex(item.company)}\\begin{itemize}${(item.bullets || []).map((bullet) => `\\item ${escapeLatex(bullet)}`).join('')}\\end{itemize}`).join('\\vspace{4pt}')
  return `\\documentclass[10pt]{article}\n\\usepackage[margin=0.65in]{geometry}\n\\usepackage{enumitem}\n\\pagestyle{empty}\n% ResumeAI template: ${templateMarker}\n\\begin{document}\n{\\LARGE \\textbf{${escapeLatex(personal.name)}}}\\\\\n${escapeLatex(personal.role)}\\\\\n${escapeLatex(personal.email)} \\textbar{} ${escapeLatex(personal.phone)} \\textbar{} ${escapeLatex(personal.location)}\n\\section*{Summary}\n${escapeLatex(resume.summary)}\n\\section*{Experience}\n${experience}\n\\section*{Education}\n${escapeLatex(resume.education || '')}\n\\section*{Skills}\n${escapeLatex((resume.skills || []).join(', '))}\n\\end{document}`
}