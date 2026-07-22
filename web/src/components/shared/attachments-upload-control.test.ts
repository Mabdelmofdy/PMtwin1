import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { appendAttachmentNames } from './attachments-upload-helpers.ts'

describe('appendAttachmentNames', () => {
  it('appends unique file names to empty text', () => {
    assert.equal(
      appendAttachmentNames('', [{ fileName: 'design-brief.pdf' }]),
      'design-brief.pdf',
    )
  })

  it('appends without duplicating case-insensitively', () => {
    assert.equal(
      appendAttachmentNames('design-brief.pdf', [
        { fileName: 'Design-Brief.pdf' },
        { fileName: 'portfolio.pdf' },
      ]),
      'design-brief.pdf, portfolio.pdf',
    )
  })
})
