/**
 * SkillManager: settings tab that lists the skills in dsh's own directory
 * (~/.dsh/skills, sourced through the host RPC) and opens the import dialog.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import { skillRpc, deleteSkillEndpoint, uploadSkillEndpoint, type UploadSkillFile } from './index.ts'
import css from './skill-manager.module.css'
import { ImportDialog } from './ImportDialog.tsx'
import { SkillDetailDialog } from './SkillDetailDialog.tsx'
import type { ExternalSkill } from './skill-types.ts'

export type SkillManagerProps = PropsRuntime<'settings.section'> & PropsLocale<typeof NS>

/** One skill row shown in the list (a JSON-safe slice of the host's ExternalSkill). */
interface SkillInfo {
  readonly name: string
  readonly description: string
  readonly enabled: boolean
  readonly path: string
  readonly files?: readonly string[]
  readonly isSymlink?: boolean
  readonly linkTarget?: string
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
const DSH_SOURCE = 'dsh'

export function SkillManager({ t }: SkillManagerProps): JSX.Element {
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<SkillInfo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<ExternalSkill | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const loadInFlightRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (loadInFlightRef.current) return
    const initialLoad = !hasLoadedRef.current
    loadInFlightRef.current = true
    if (initialLoad) setLoading(true)
    else setRefreshing(true)
    setLoadError(null)
    try {
      const list = await skillRpc<Array<Omit<SkillInfo, 'enabled'>>>('scan', { source: DSH_SOURCE })
      setSkills(list.map((s) => ({ ...s, enabled: true })))
      hasLoadedRef.current = true
    } catch (e) {
      if (initialLoad) setLoadError((e as Error).message)
    } finally {
      loadInFlightRef.current = false
      if (initialLoad) setLoading(false)
      else setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return skills
    const q = search.toLowerCase()
    return skills.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
  }, [skills, search])

  const toggleEnabled = useCallback((name: string) => {
    setSkills((prev) => prev.map((s) => s.name === name ? { ...s, enabled: !s.enabled } : s))
  }, [])

  const deleteSkill = useCallback(async () => {
    if (!confirmDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSkillEndpoint(confirmDelete.name)
      setConfirmDelete(null)
      await load()
    } catch (error) {
      setDeleteError((error as Error).message)
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, load])

  const onPickFolder = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (files.length === 0) return
    const top = files[0].webkitRelativePath.split('/')[0] || ''
    if (!top) return
    setUploading(true)
    setUploadError(null)
    try {
      const entries: UploadSkillFile[] = []
      for (const file of files) {
        const rel = file.webkitRelativePath.split('/').slice(1).join('/')
        if (!rel) continue
        entries.push({ path: rel, content: await readAsBase64(file) })
      }
      if (entries.length === 0) return
      const result = await uploadSkillEndpoint(top, entries, 'global')
      if (result.failed.length > 0 && result.imported.length === 0) {
        setUploadError(result.failed[0]?.message ?? t('upload.failed'))
      }
      if (result.imported.length > 0) void load()
    } catch (error) {
      setUploadError((error as Error).message)
    } finally {
      setUploading(false)
    }
  }, [load, t])
  const installedCount = skills.length

  return (
    <div className={css.root}>
      {/* Header */}
      <div className={css.header}>
        <h2 className={css.title}>{t('title')}</h2>
        <div className={css.subtitleRow}>
          <span className={css.skillCount}>{t('subtitle', { n: installedCount })}</span>
        </div>
        <input
          type="text"
          className={css.searchInput}
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Action bar */}
      <div className={css.actionBar}>
        <span className={css.installedLabel}>{t('installed', { n: installedCount })}</span>
        <div className={css.actionButtons}>
          <button type="button" className={`${css.actionBtn} ${refreshing ? css.actionBtnBusy : ''}`} title={t('btn.refresh')} onClick={() => void load()} disabled={refreshing || loading}>↻</button>
          <button type="button" className={css.actionBtn} title={t('btn.import')} onClick={() => setShowImport(true)}>{t('btn.importShort')}</button>
          <button type="button" className={css.actionBtn} title={t('btn.upload')} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? t('upload.uploading') : t('btn.upload')}
          </button>
          <input ref={fileInputRef} type="file" className={css.hiddenFileInput} multiple {...{ webkitdirectory: '' }} onChange={(event) => void onPickFolder(event)} />
        </div>
      </div>

      {uploadError && <div className={css.uploadError} role="alert">{uploadError}</div>}

      {deleteError && <div className={css.uploadError} role="alert">{deleteError}</div>}

      {loading && <div className={css.empty}>{t('loading')}</div>}
      {!loading && loadError && <div className={css.empty}>{loadError}</div>}

      {/* Skill list */}
      {!loading && !loadError && (
        <div className={css.skillList}>
          {filtered.length === 0 && (
            <div className={css.empty}>
              <p>{t('empty')}</p>
              <p className={css.emptyHint}>{t('empty.import')}</p>
            </div>
          )}
          {filtered.map((skill) => (
            <div key={skill.name} className={css.skillRow}>
              <button
                type="button"
                className={css.skillInfoButton}
                onClick={() => setSelectedDetail({
                  name: skill.name,
                  description: skill.description,
                  source: DSH_SOURCE,
                  path: skill.path,
                  files: skill.files ?? ['SKILL.md'],
                  isSymlink: skill.isSymlink,
                  linkTarget: skill.linkTarget,
                })}
              >
                <div className={css.skillInfo}>
                  <div className={css.skillName}>
                    {skill.name}
                    {skill.isSymlink && <span className={css.linkBadge}>symlink</span>}
                  </div>
                  <div className={css.skillDesc}>{skill.description}</div>
                  <div className={css.skillMeta}>
                    <span className={css.skillPath}>{skill.path}</span>
                    {skill.linkTarget && <span className={css.linkTarget}>→ {skill.linkTarget}</span>}
                  </div>
                </div>
              </button>
              <div className={css.skillActions}>
                <label className={css.toggle}>
                  <input type="checkbox" checked={skill.enabled} onChange={(event) => {
                    event.stopPropagation()
                    toggleEnabled(skill.name)
                  }} />
                  <span className={css.toggleSlider} />
                </label>
                <button
                  type="button"
                  className={css.deleteBtn}
                  onClick={(event) => {
                    event.stopPropagation()
                    setConfirmDelete(skill)
                  }}
                  title={t('btn.delete')}
                >{t('btn.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className={css.modal} role="presentation">
          <section className={css.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="delete-skill-title" aria-describedby="delete-skill-description">
            <header className={css.confirmHeader}>
              <div>
                <h3 id="delete-skill-title">{t('delete.title')}</h3>
                <p id="delete-skill-description">{t('delete.message', { name: confirmDelete.name })}</p>
              </div>
              <button type="button" className={css.iconButton} aria-label={t('btn.cancel')} onClick={() => setConfirmDelete(null)} disabled={deleting}>×</button>
            </header>
            <div className={css.confirmBody}>
              <div className={css.confirmSkillName}>{confirmDelete.name}</div>
              <div className={css.confirmPath}>{confirmDelete.path}</div>
              <div className={css.confirmWarning}>
                {confirmDelete.isSymlink ? t('delete.symlinkWarning') : t('delete.directoryWarning')}
              </div>
              {deleteError && <div className={css.confirmError} role="alert">{deleteError}</div>}
            </div>
            <footer className={css.confirmFooter}>
              <button type="button" className={css.modalBtn} onClick={() => setConfirmDelete(null)} disabled={deleting}>{t('btn.cancel')}</button>
              <button type="button" className={css.modalBtnDanger} onClick={() => void deleteSkill()} disabled={deleting}>
                {deleting ? t('delete.deleting') : t('btn.confirm')}
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Import dialog */}
      {selectedDetail && (
        <SkillDetailDialog
          skill={selectedDetail}
          sourceLabel={t('source.dsh')}
          t={t}
          onClose={() => setSelectedDetail(null)}
        />
      )}
      {showImport && (
        <ImportDialog
          t={t}
          onClose={() => setShowImport(false)}
          onImported={() => {
            void load()
          }}
        />
      )}
    </div>
  )
}
