/**
 * SkillManager: settings tab for browsing and managing DSH skills.
 *
 * M1: skill list with search, enable/disable toggle, delete.
 * Skills are discovered from the host via ctx.skills service.
 * The host reads from known filesystem paths.
 */
import { useCallback, useMemo, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './skill-manager.module.css'
import { ImportDialog } from './ImportDialog.tsx'

export type SkillManagerProps = PropsRuntime<'settings.plugins.tab'> & PropsLocale<typeof NS>

interface SkillInfo {
  readonly name: string
  readonly description: string
  readonly source: string
  readonly enabled: boolean
  readonly path: string
  readonly isSymlink?: boolean
  readonly linkTarget?: string
}

const MOCK_SKILLS: SkillInfo[] = [
  { name: 'brainstorming', description: 'You MUST use this before any creative work – creating features, building components, adding functionality, or modifying existing code.', source: 'zcode', enabled: true, path: '~/.zcode/skills/brainstorming' },
  { name: 'cms-dual-repo-sync', description: '当需要比较 DxCMS 与 yfy 的差异、判断某个 CMS 问题是公共 bug 还是项目定制问题...', source: 'zcode', enabled: true, path: '~/.zcode/skills/cms-dual-repo-sync' },
  { name: 'design-taste-frontend', description: 'Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design...', source: 'zcode', enabled: true, path: '~/.zcode/skills/design-taste-frontend' },
  { name: 'dxcms-backend-module-boundaries', description: 'Use when modifying DxCMS CMS, System, Infra, BPM, Report, or Framework modules and adding, replacing, or reviewing...', source: 'zcode', enabled: true, path: '~/.zcode/skills/dxcms-backend-module-boundaries' },
  { name: 'dxcms-freemarker', description: 'DxCMS前台Freemarker模板开发专家技能。适用场景：1. 开发DxCMS前台模板...', source: 'zcode', enabled: true, path: '~/.zcode/skills/dxcms-freemarker' },
  { name: 'dxcms-git-branch-workflow', description: '当需要处理 DxCMS 公共 dev 与 project/gxxd、project/aiStore 等多项目长期分支协作...', source: 'zcode', enabled: true, path: '~/.zcode/skills/dxcms-git-branch-workflow' },
  { name: 'linked-skill', description: 'This skill is a symlink pointing to another location.', source: 'dsh', enabled: true, path: '~/.dsh/skills/linked-skill', isSymlink: true, linkTarget: '/Volumes/GM7/code/my-skills/linked-skill' },
  { name: 'dxcms-template-design', description: 'DxCMS前台模板设计判断技能。适用场景：1. 设计 DxCMS 首页、栏目页、内容页、专题页、会员页的页面结构和信息层级...', source: 'zcode', enabled: true, path: '~/.zcode/skills/dxcms-template-design' },
  { name: 'git-commit', description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation.', source: 'zcode', enabled: true, path: '~/.zcode/skills/git-commit' },
  { name: 'image-to-code', description: 'Convert design images and screenshots into functional code implementations.', source: 'zcode', enabled: true, path: '~/.zcode/skills/image-to-code' },
  { name: 'coding-agent', description: 'Best practices for writing clean, maintainable, and production-ready code.', source: 'dsh', enabled: true, path: '~/.dsh/skills/coding-agent' },
  { name: 'data-analysis', description: 'Analyze datasets, generate insights, and create visualizations.', source: 'dsh', enabled: false, path: '~/.dsh/skills/data-analysis' },
]

const SOURCE_OPTIONS = [
  { key: 'all', labelKey: 'source.all' },
  { key: 'dsh', labelKey: 'source.dsh' },
  { key: 'codex', labelKey: 'source.codex' },
  { key: 'claude', labelKey: 'source.claude' },
  { key: 'zcode', labelKey: 'source.zcode' },
  { key: 'workbuddy', labelKey: 'source.workbuddy' },
  { key: 'qcoderwork', labelKey: 'source.qcoderwork' },
] as const

export function SkillManager({ t }: SkillManagerProps): JSX.Element {
  const [skills, setSkills] = useState<SkillInfo[]>(MOCK_SKILLS)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const filtered = useMemo(() => {
    let list = skills
    if (sourceFilter !== 'all') list = list.filter((s) => s.source === sourceFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    return list
  }, [skills, search, sourceFilter])

  const toggleEnabled = useCallback((name: string) => {
    setSkills((prev) => prev.map((s) => s.name === name ? { ...s, enabled: !s.enabled } : s))
  }, [])

  const deleteSkill = useCallback((name: string) => {
    setSkills((prev) => prev.filter((s) => s.name !== name))
    setConfirmDelete(null)
  }, [])

  const installedCount = skills.length
  const enabledCount = skills.filter((s) => s.enabled).length

  return (
    <div className={css.root}>
      {/* Header */}
      <div className={css.header}>
        <h2 className={css.title}>{t('title')}</h2>
        <div className={css.subtitleRow}>
          <span className={css.sourceBadge}>{t('source.all')}</span>
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
          <button type="button" className={css.actionBtn} title={t('btn.import')} onClick={() => setShowImport(true)}>{t('btn.importShort')}</button>
          <button type="button" className={css.actionBtn} title={t('btn.refresh')}>↻</button>
          <button type="button" className={css.actionBtnPrimary}>{t('btn.new')}</button>
        </div>
      </div>

      {/* Source filter */}
      <div className={css.filterRow}>
        {SOURCE_OPTIONS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            className={`${css.filterChip} ${sourceFilter === key ? css.filterChipActive : ''}`}
            onClick={() => setSourceFilter(key)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Skill list */}
      <div className={css.skillList}>
        {filtered.length === 0 && (
          <div className={css.empty}>
            <p>{t('empty')}</p>
            <p className={css.emptyHint}>{t('empty.import')}</p>
          </div>
        )}
        {filtered.map((skill) => (
          <div key={skill.name} className={`${css.skillRow} ${skill.isSymlink ? css.skillRowLinked : ''}`}>
            <div className={css.skillIcon}>{skill.isSymlink ? '🔗' : '📋'}</div>
            <div className={css.skillInfo}>
              <div className={css.skillName}>
                {skill.name}
                {skill.isSymlink && <span className={css.linkBadge}>symlink</span>}
              </div>
              <div className={css.skillDesc}>{skill.description}</div>
              <div className={css.skillMeta}>
                <span className={css.skillSource}>{skill.source}</span>
                <span className={css.skillPath}>{skill.path}</span>
                {skill.linkTarget && <span className={css.linkTarget}>→ {skill.linkTarget}</span>}
              </div>
            </div>
            <div className={css.skillActions}>
              <label className={css.toggle}>
                <input
                  type="checkbox"
                  checked={skill.enabled}
                  onChange={() => toggleEnabled(skill.name)}
                />
                <span className={css.toggleSlider} />
              </label>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={() => setConfirmDelete(skill.name)}
                title={t('btn.delete')}
              >🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className={css.modal}>
          <div className={css.modalContent}>
            <p>{t('confirm.delete', { name: confirmDelete })}</p>
            <div className={css.modalActions}>
              <button type="button" className={css.modalBtn} onClick={() => setConfirmDelete(null)}>{t('btn.cancel')}</button>
              <button type="button" className={css.modalBtnDanger} onClick={() => deleteSkill(confirmDelete)}>{t('btn.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Import dialog */}
      {showImport && (
        <ImportDialog
          t={t}
          onClose={() => setShowImport(false)}
          onImported={(count) => {
            console.log(`[skill-manager] imported ${count} skills`)
          }}
        />
      )}
    </div>
  )
}
