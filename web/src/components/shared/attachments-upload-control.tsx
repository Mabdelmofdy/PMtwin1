import { useId, useRef, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { PmButton, type PmButtonProps } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import type { AttachmentFileMeta } from './attachments-upload-helpers.ts'

export type { AttachmentFileMeta } from './attachments-upload-helpers.ts'
export { appendAttachmentNames } from './attachments-upload-helpers.ts'

export type AttachmentsUploadControlProps = {
  readonly onFilesSelected: (files: readonly AttachmentFileMeta[]) => void
  readonly accept?: string
  readonly multiple?: boolean
  readonly disabled?: boolean
  readonly label?: string
  readonly size?: PmButtonProps['size']
  readonly variant?: PmButtonProps['variant']
  readonly className?: string
  readonly inputId?: string
  readonly 'aria-label'?: string
}

function toAttachmentMeta(file: File): AttachmentFileMeta {
  return {
    fileName: file.name,
    ...(file.type ? { mimeType: file.type } : {}),
    ...(Number.isFinite(file.size) ? { sizeBytes: file.size } : {}),
  }
}

/**
 * Metadata-oriented file picker used in Attachments sections.
 * Captures file names (and optional mime/size); does not persist binary content.
 */
export function AttachmentsUploadControl({
  onFilesSelected,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt',
  multiple = true,
  disabled = false,
  label = 'Upload',
  size = 'sm',
  variant = 'outline',
  className,
  inputId,
  'aria-label': ariaLabel = 'Upload attachments',
}: AttachmentsUploadControlProps) {
  const generatedId = useId()
  const resolvedInputId = inputId ?? `attachments-upload-${generatedId}`
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files
    if (!selected || selected.length === 0) return
    onFilesSelected(Array.from(selected).map(toAttachmentMeta))
    // Allow selecting the same file again.
    event.target.value = ''
  }

  return (
    <div className={cn('inline-flex', className)}>
      <input
        ref={inputRef}
        id={resolvedInputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={handleChange}
      />
      <PmButton
        type="button"
        size={size}
        variant={variant}
        disabled={disabled}
        aria-controls={resolvedInputId}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" aria-hidden />
        {label}
      </PmButton>
    </div>
  )
}
