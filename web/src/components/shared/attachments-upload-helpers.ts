export type AttachmentFileMeta = {
  readonly fileName: string
  readonly mimeType?: string
  readonly sizeBytes?: number
}

/** Maximum attachments allowed across existing + newly accepted files. */
export const MAX_ATTACHMENTS = 3

/** Maximum size per file in bytes (5 MB). */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** Allowed extensions (lowercase, with leading dot). */
export const ATTACHMENT_ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
] as const

/** Allowed MIME types matching the application attachment set. */
export const ATTACHMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
] as const

const ALLOWED_EXTENSION_SET = new Set<string>(ATTACHMENT_ALLOWED_EXTENSIONS)
const ALLOWED_MIME_SET = new Set<string>(
  ATTACHMENT_ALLOWED_MIME_TYPES.map((mime) => mime.toLowerCase()),
)

const ALLOWED_TYPE_LABELS = 'PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, WEBP, TXT'

/** Default `accept` attribute: extensions + MIME types. */
export const ATTACHMENT_ACCEPT =
  `${ATTACHMENT_ALLOWED_EXTENSIONS.join(',')},${ATTACHMENT_ALLOWED_MIME_TYPES.join(',')}`

export type AttachmentFileLike = {
  readonly name: string
  readonly type?: string
  readonly size?: number
}

export type AttachmentRejection = {
  readonly fileName: string
  readonly message: string
}

export type AttachmentValidationResult = {
  readonly accepted: readonly AttachmentFileMeta[]
  readonly rejected: readonly AttachmentRejection[]
}

/** Parse comma-separated attachment names from text. */
export function parseAttachmentNames(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Append unique file names to a comma-separated attachments text value. */
export function appendAttachmentNames(
  existingText: string,
  files: readonly AttachmentFileMeta[],
): string {
  const existing = parseAttachmentNames(existingText)
  const seen = new Set(existing.map((name) => name.toLowerCase()))
  const next = [...existing]
  for (const file of files) {
    const name = file.fileName.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(name)
  }
  return next.join(', ')
}

function fileExtension(fileName: string): string {
  const base = fileName.trim()
  const dot = base.lastIndexOf('.')
  if (dot < 0) return ''
  return base.slice(dot).toLowerCase()
}

export function isAcceptedAttachmentType(file: AttachmentFileLike): boolean {
  const extension = fileExtension(file.name)
  if (extension && ALLOWED_EXTENSION_SET.has(extension)) return true
  const mime = (file.type ?? '').trim().toLowerCase()
  if (mime && ALLOWED_MIME_SET.has(mime)) return true
  return false
}

export function toAttachmentMeta(file: AttachmentFileLike): AttachmentFileMeta {
  const mimeType = (file.type ?? '').trim()
  const sizeBytes = file.size
  return {
    fileName: file.name,
    ...(mimeType ? { mimeType } : {}),
    ...(sizeBytes != null && Number.isFinite(sizeBytes) ? { sizeBytes } : {}),
  }
}

function unsupportedTypeMessage(fileName: string): string {
  return `Unsupported file type: ${fileName}. Allowed: ${ALLOWED_TYPE_LABELS}.`
}

function exceedsSizeMessage(fileName: string): string {
  return `${fileName} exceeds the 5 MB maximum file size.`
}

function duplicateMessage(fileName: string): string {
  return `${fileName} is already attached.`
}

/**
 * Validate a selection against type, size, duplicates, and max attachment count.
 * Rejected files are never included in `accepted`.
 */
export function validateAttachmentSelection(options: {
  readonly files: readonly AttachmentFileLike[]
  readonly existingFileNames?: readonly string[]
  readonly maxAttachments?: number
  readonly maxFileSizeBytes?: number
}): AttachmentValidationResult {
  const {
    files,
    existingFileNames = [],
    maxAttachments = MAX_ATTACHMENTS,
    maxFileSizeBytes = MAX_FILE_SIZE_BYTES,
  } = options

  const accepted: AttachmentFileMeta[] = []
  const rejected: AttachmentRejection[] = []
  const seen = new Set(
    existingFileNames.map((name) => name.trim().toLowerCase()).filter(Boolean),
  )
  let acceptedCount = existingFileNames.filter((name) => name.trim()).length

  for (const file of files) {
    const fileName = file.name.trim() || file.name

    if (!isAcceptedAttachmentType(file)) {
      rejected.push({ fileName, message: unsupportedTypeMessage(fileName) })
      continue
    }

    const size = file.size
    if (size != null && Number.isFinite(size) && size > maxFileSizeBytes) {
      rejected.push({ fileName, message: exceedsSizeMessage(fileName) })
      continue
    }

    const key = fileName.toLowerCase()
    if (seen.has(key)) {
      rejected.push({ fileName, message: duplicateMessage(fileName) })
      continue
    }

    if (acceptedCount >= maxAttachments) {
      rejected.push({
        fileName,
        message: 'Maximum 3 attachments are allowed.',
      })
      continue
    }

    seen.add(key)
    acceptedCount += 1
    accepted.push(toAttachmentMeta(file))
  }

  return { accepted, rejected }
}
