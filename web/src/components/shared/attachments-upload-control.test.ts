import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ATTACHMENT_ALLOWED_EXTENSIONS,
  ATTACHMENT_ALLOWED_MIME_TYPES,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE_BYTES,
  appendAttachmentNames,
  isAcceptedAttachmentType,
  parseAttachmentNames,
  validateAttachmentSelection,
  type AttachmentFileLike,
} from './attachments-upload-helpers.ts'

function file(
  name: string,
  options: { type?: string; size?: number } = {},
): AttachmentFileLike {
  return {
    name,
    ...(options.type != null ? { type: options.type } : {}),
    ...(options.size != null ? { size: options.size } : {}),
  }
}

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

describe('parseAttachmentNames', () => {
  it('splits and trims comma-separated names', () => {
    assert.deepEqual(parseAttachmentNames(' a.pdf, b.png , '), ['a.pdf', 'b.png'])
  })
})

describe('isAcceptedAttachmentType', () => {
  it('accepts every application extension', () => {
    for (const extension of ATTACHMENT_ALLOWED_EXTENSIONS) {
      assert.equal(
        isAcceptedAttachmentType(file(`sample${extension}`)),
        true,
        `expected ${extension} to be accepted`,
      )
    }
  })

  it('accepts every application MIME type', () => {
    for (const mime of ATTACHMENT_ALLOWED_MIME_TYPES) {
      assert.equal(
        isAcceptedAttachmentType(file('blob.bin', { type: mime })),
        true,
        `expected ${mime} to be accepted`,
      )
    }
  })

  it('rejects unsupported types', () => {
    assert.equal(isAcceptedAttachmentType(file('malware.exe')), false)
    assert.equal(isAcceptedAttachmentType(file('photo.gif', { type: 'image/gif' })), false)
  })
})

describe('validateAttachmentSelection', () => {
  it('accepts supported files within limits', () => {
    const result = validateAttachmentSelection({
      files: [
        file('brief.pdf', { type: 'application/pdf', size: 1024 }),
        file('shot.PNG', { type: 'image/png', size: 2048 }),
      ],
    })
    assert.equal(result.accepted.length, 2)
    assert.equal(result.rejected.length, 0)
    assert.deepEqual(
      result.accepted.map((item) => item.fileName),
      ['brief.pdf', 'shot.PNG'],
    )
  })

  it('rejects when maximum 3 attachments would be exceeded', () => {
    const result = validateAttachmentSelection({
      existingFileNames: ['a.pdf', 'b.pdf'],
      files: [file('c.pdf'), file('d.pdf')],
    })
    assert.equal(result.accepted.length, 1)
    assert.equal(result.accepted[0]?.fileName, 'c.pdf')
    assert.equal(result.rejected.length, 1)
    assert.equal(result.rejected[0]?.message, 'Maximum 3 attachments are allowed.')
    assert.equal(MAX_ATTACHMENTS, 3)
  })

  it('rejects files larger than 5 MB', () => {
    const result = validateAttachmentSelection({
      files: [file('huge.pdf', { size: MAX_FILE_SIZE_BYTES + 1 })],
    })
    assert.equal(result.accepted.length, 0)
    assert.equal(result.rejected.length, 1)
    assert.equal(
      result.rejected[0]?.message,
      'huge.pdf exceeds the 5 MB maximum file size.',
    )
  })

  it('rejects duplicate file names against existing and in-batch', () => {
    const result = validateAttachmentSelection({
      existingFileNames: ['Design-Brief.pdf'],
      files: [
        file('design-brief.pdf'),
        file('portfolio.pdf'),
        file('Portfolio.PDF'),
      ],
    })
    assert.deepEqual(
      result.accepted.map((item) => item.fileName),
      ['portfolio.pdf'],
    )
    assert.equal(result.rejected.length, 2)
    assert.equal(result.rejected[0]?.message, 'design-brief.pdf is already attached.')
    assert.equal(result.rejected[1]?.message, 'Portfolio.PDF is already attached.')
  })

  it('rejects unsupported file types with allowed-type message', () => {
    const result = validateAttachmentSelection({
      files: [file('notes.exe')],
    })
    assert.equal(result.accepted.length, 0)
    assert.match(
      result.rejected[0]?.message ?? '',
      /Unsupported file type: notes\.exe\. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, WEBP, TXT\./,
    )
  })

  it('partitions mixed accepted and rejected selections', () => {
    const result = validateAttachmentSelection({
      existingFileNames: ['keep.pdf'],
      files: [
        file('ok.png', { type: 'image/png', size: 100 }),
        file('bad.exe'),
        file('keep.pdf'),
        file('too-big.docx', { size: MAX_FILE_SIZE_BYTES + 10 }),
        file('third.txt', { type: 'text/plain', size: 50 }),
        file('fourth.jpg'),
      ],
    })
    assert.deepEqual(
      result.accepted.map((item) => item.fileName),
      ['ok.png', 'third.txt'],
    )
    assert.equal(result.rejected.length, 4)
    assert.match(result.rejected[0]?.message ?? '', /Unsupported file type: bad\.exe/)
    assert.equal(result.rejected[1]?.message, 'keep.pdf is already attached.')
    assert.equal(
      result.rejected[2]?.message,
      'too-big.docx exceeds the 5 MB maximum file size.',
    )
    assert.equal(result.rejected[3]?.message, 'Maximum 3 attachments are allowed.')
  })

  it('allows the same file to be validated again after a prior acceptance (reset-safe)', () => {
    const first = validateAttachmentSelection({
      files: [file('repeat.pdf', { type: 'application/pdf', size: 10 })],
    })
    assert.equal(first.accepted.length, 1)

    const second = validateAttachmentSelection({
      existingFileNames: [],
      files: [file('repeat.pdf', { type: 'application/pdf', size: 10 })],
    })
    assert.equal(second.accepted.length, 1)
    assert.equal(second.accepted[0]?.fileName, 'repeat.pdf')
  })
})
