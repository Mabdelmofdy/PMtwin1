export type ExplanationMetadata = {
  readonly generatedAt: string
  readonly engineVersion: string
  readonly knowledgeVersion?: number
  readonly locale?: string
  readonly source?: string
  readonly tags?: readonly string[]
  readonly extensions?: Readonly<Record<string, unknown>>
}
