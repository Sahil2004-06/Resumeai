import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth/mammoth.browser'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export async function extractDocumentText(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'txt' || extension === 'md') return file.text()
  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }
  if (extension === 'pdf') {
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const pages = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(content.items.map((item) => item.str).join(' '))
    }
    return pages.join('\n\n')
  }
  throw new Error('Please upload a PDF, DOCX, TXT, or MD file.')
}
