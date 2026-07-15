import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'profile-view.tsx'),
  'utf8',
)

describe('ProfileView edit contract', () => {
  it('provides create, edit, save, and cancel actions', () => {
    assert.match(source, /profile \? 'Edit profile' : 'Create profile'/)
    assert.match(source, /submitLabel="Save profile"/)
    assert.match(source, /onCancel=\{cancelEditing\}/)
  })

  it('collects editable profile fields and comma-separated skills', () => {
    for (const fieldId of [
      'profile-name',
      'profile-headline',
      'profile-location',
      'profile-bio',
      'profile-skills',
      'profile-description',
      'profile-phone',
      'profile-website',
      'profile-linkedin',
      'profile-services',
      'profile-languages',
      'profile-certifications',
      'profile-work-mode',
      'profile-availability',
      'profile-years-experience',
      'profile-work-history',
      'profile-education',
      'profile-portfolio',
      'profile-testimonials',
    ]) {
      assert.match(source, new RegExp(`id="${fieldId}"`))
    }
    assert.match(source, /splitList\(draft\.skills\)/)
    assert.match(source, /onSave\?\.\(\{/)
  })

  it('keeps email read-only and requires a name', () => {
    assert.match(source, /id="profile-email"[\s\S]*?<Input value=\{email \?\? ''\} disabled/)
    assert.match(source, /setNameError\('Name is required\.'\)/)
  })
})
