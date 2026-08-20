export interface ExternalSkill {
  readonly name: string
  readonly description: string
  readonly source: string
  readonly path: string
  readonly files: readonly string[]
  readonly isSymlink?: boolean
  readonly linkTarget?: string
}

export interface ImportResult {
  readonly imported: readonly string[]
  readonly skipped: readonly string[]
  readonly failed: readonly { readonly name: string; readonly message: string }[]
}
