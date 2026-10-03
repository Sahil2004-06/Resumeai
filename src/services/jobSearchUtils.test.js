import test from 'node:test'
import assert from 'node:assert/strict'

import { buildJobSearchQuery, normalizeJobResult } from './jobSearchUtils.js'

test('buildJobSearchQuery includes role and skills for real job searches', () => {
  const query = buildJobSearchQuery({
    personal: { role: 'Senior Frontend Engineer', location: 'San Francisco, CA' },
    skills: ['React', 'TypeScript', 'JavaScript'],
  })

  assert.match(query, /Senior Frontend Engineer/i)
  assert.match(query, /React/i)
  assert.match(query, /TypeScript/i)
  assert.match(query, /jobs?/i)
})

test('normalizeJobResult keeps actual job title, company and skills from the provider payload', () => {
  const job = normalizeJobResult({
    title: 'Senior Frontend Engineer',
    company: 'Linear',
    location: 'Remote, US',
    url: 'https://linear.app/careers',
    description: 'Build product experiences in React and TypeScript.',
    skills: ['React', 'TypeScript', 'GraphQL'],
  })

  assert.equal(job.title, 'Senior Frontend Engineer')
  assert.equal(job.company, 'Linear')
  assert.equal(job.location, 'Remote, US')
  assert.deepEqual(job.skills, ['React', 'TypeScript', 'GraphQL'])
})
