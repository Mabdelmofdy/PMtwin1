export type AttachmentFileMeta = {
  readonly fileName: string
  readonly mimeType?: string
  readonly sizeBytes?: number
}

/** Append unique file names to a comma-separated attachments text value. */
export function appendAttachmentNames(
  existingText: string,
  files: readonly AttachmentFileMeta[],
): string {
  const existing = existingText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
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
