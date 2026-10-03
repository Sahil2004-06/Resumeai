const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim()

export function calculateAtsScore(resumeData, jobAnalysis = {}) {
  const resumeText = normalize(JSON.stringify(resumeData))
  const requiredKeywords = [...new Set([...(jobAnalysis.requiredSkills || []), ...(jobAnalysis.keywords || [])].map(normalize).filter(Boolean))]
  const matchedKeywords = requiredKeywords.filter((keyword) => resumeText.includes(keyword))
  const sections = ['personal', 'summary', 'experience', 'education', 'skills']
  const completeSections = sections.filter((section) => resumeData?.[section] && JSON.stringify(resumeData[section]).length > 4).length
  const keywordScore = requiredKeywords.length ? Math.round((matchedKeywords.length / requiredKeywords.length) * 40) : 32
  const completenessScore = Math.round((completeSections / sections.length) * 30)
  const formattingScore = resumeData?.personal?.email && resumeData?.personal?.name ? 20 : 10
  return { score: Math.min(100, keywordScore + completenessScore + formattingScore + 10), matchedKeywords, missingKeywords: requiredKeywords.filter((keyword) => !matchedKeywords.includes(keyword)), breakdown: { keywordMatch: keywordScore, sectionCompleteness: completenessScore, contactDetails: formattingScore, formatting: 10 } }
}