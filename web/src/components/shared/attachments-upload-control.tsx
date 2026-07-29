import { useId, useState, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import {
  pmButtonVariants,
  type PmButtonProps,
} from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import {
  ATTACHMENT_ACCEPT,
  type AttachmentFileMeta,
  validateAttachmentSelection,
} from './attachments-upload-helpers.ts'

export type { AttachmentFileMeta } from './attachments-upload-helpers.ts'
export {
  appendAttachmentNames,
  parseAttachmentNames,
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE_BYTES,
  validateAttachmentSelection,
} from './attachments-upload-helpers.ts'

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
  readonly existingFileNames?: readonly string[]
  readonly 'aria-label'?: string
}

/**
 * Metadata-oriented file picker used in Attachments sections.
 * Captures file names (and optional mime/size); does not persist binary content.
 */
export function AttachmentsUploadControl({
  onFilesSelected,
  accept = ATTACHMENT_ACCEPT,
  multiple = true,
  disabled = false,
  label = 'Upload',
  size = 'sm',
  variant = 'outline',
  className,
  inputId,
  existingFileNames = [],
  'aria-label': ariaLabel = 'Upload attachments',
}: AttachmentsUploadControlProps) {
  const generatedId = useId()
  const resolvedInputId = inputId ?? `attachments-upload-${generatedId}`
  const [selectedNames, setSelectedNames] = useState<readonly string[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessages, setErrorMessages] = useState<readonly string[]>([])

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files
    if (!selected || selected.length === 0) {
      event.target.value = ''
      return
    }

    const result = validateAttachmentSelection({
      files: Array.from(selected),
      existingFileNames,
    })

    if (result.accepted.length > 0) {
      onFilesSelected(result.accepted)
      setSelectedNames(result.accepted.map((file) => file.fileName))
      setSuccessMessage(
        result.accepted.length === 1
          ? '1 file selected'
          : `${result.accepted.length} files selected`,
      )
    } else {
      setSelectedNames([])
      setSuccessMessage(null)
    }

    setErrorMessages(result.rejected.map((item) => item.message))

    // Allow selecting the same file again.
    event.target.value = ''
  }

  return (
    <div className={cn('inline-flex flex-col gap-1.5', className)}>
      <input
        id={resolvedInputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={handleChange}
      />
      <label
        htmlFor={resolvedInputId}
        className={cn(
          pmButtonVariants({ size, variant }),
          disabled && 'pointer-events-none opacity-50',
          'cursor-pointer',
        )}
        aria-disabled={disabled || undefined}
      >
        <Upload className="size-4" aria-hidden />
        {label}
      </label>

      {successMessage ? (
        <p
          className={cn(pmTypography.caption, 'text-success')}
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      {selectedNames.length > 0 ? (
        <ul className={cn(pmTypography.caption, 'text-muted-foreground')}>
          {selectedNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : null}

      {errorMessages.length > 0 ? (
        <ul className={cn(pmTypography.caption, 'text-danger')} role="alert">
          {errorMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
