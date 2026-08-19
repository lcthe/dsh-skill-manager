/**
 * ImportDialog: scan external agent platforms and import skills.
 */
import { useCallback, useEffect, useState } from 'react'
import type { NS } from './locales.ts'
import css from './skill-manager.module.css'

interface ExternalSkill {
  readonly name: string
  readonly description: string
  readonly source: string
  readonly path: string
  readonly files: readonly string[]
}

interface ImportDialogProps {
  readonly t: (key: string, vars?: Record<string, string | number>) => string
  readonly onClose: () => void
  readonly onImported: (count: number) => void
}

const SOURCES = [
  { key: 'codex', label: 'Codex' },
  { key: 'claude', label: 'Claude Code' },
  { key: 'zcode', label: 'ZCode' },
  { key: 'workbuddy', label: 'WorkBuddy' },
  { key: 'qcoderwork', label: 'QCoderWork' },
] as const

// Simulated scan results for demo (real impl calls host handler)
const DEMO_SKILLS: Record<string, ExternalSkill[]> = {
  codex: [
    { name: 'github-pr', description: 'Automated GitHub PR review and suggestions', source: 'codex', path: '~/.codex/vendor_imports/skills/github-pr', files: ['SKILL.md'] },
    { name: 'test-writer', description: 'Generate comprehensive test suites for any codebase', source: 'codex', path: '~/.codex/vendor_imports/skills/test-writer', files: ['SKILL.md'] },
  ],
  zcode: [
    { name: 'brainstorming', description: 'Structured brainstorming for creative and technical problems', source: 'zcode', path: '~/.zcode/skills/brainstorming', files: ['SKILL.md'] },
    { name: 'git-commit', description: 'Conventional commit message generation', source: 'zcode', path: '~/.zcode/skills/git-commit', files: ['SKILL.md'] },
    { name: 'image-to-code', description: 'Convert design screenshots into code', source: 'zcode', path: '~/.zcode/skills/image-to-code', files: ['SKILL.md'] },
  ],
}

export function ImportDialog({ t, onClose, onImported }: ImportDialogProps): JSX.Element {
  const [activeSource, setActiveSource] = useState<string>('codex')
  const [scanned, setScanned] = useState<Record<string, ExternalSkill[]>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [target, setTarget] = useState<'global' | 'workspace'>('global')
  const [autoEnable, setAutoEnable] = useState(true)
  const [useSymlink, setUseSymlink] = useState(false)

  const scan = useCallback(async (source: string) => {
    // In real implementation: const result = await host.call('skill-manager.scan', { source })
    // For demo, use simulated data
    setScanned((prev) => ({ ...prev, [source]: DEMO_SKILLS[source] ?? [] }))
  }, [])

  useEffect(() => {
    scan(activeSource)
  }, [activeSource, scan])

  const skills = scanned[activeSource] ?? []
  const selectedCount = selected.size

  const toggleSkill = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedCount === skills.length) setSelected(new Set())
    else setSelected(new Set(skills.map((s) => s.name)))
  }, [skills, selectedCount])

  const doImport = useCallback(async () => {
    setImporting(true)
    // In real implementation: await host.call('skill-manager.import', { skills: ..., target: ... })
    await new Promise((r) => setTimeout(r, 500)) // simulate
    onImported(selectedCount)
    onClose()
  }, [selectedCount, onImported, onClose])

  return (
    <div className={css.modal}>
      <div className={css.importDialog}>
        <div className={css.importHeader}>
          <h3>{t('import.title')}</h3>
          <button type="button" className={css.modalBtn} onClick={onClose}>✕</button>
        </div>

        {/* Source tabs */}
        <div className={css.importSources}>
          {SOURCES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${css.importSourceTab} ${activeSource === key ? css.importSourceActive : ''}`}
              onClick={() => setActiveSource(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Skills list */}
        <div className={css.importList}>
          {skills.length === 0 && <div className={css.empty}>{t('empty')}</div>}
          {skills.map((skill) => (
            <label key={skill.name} className={css.importRow}>
              <input
                type="checkbox"
                checked={selected.has(skill.name)}
                onChange={() => toggleSkill(skill.name)}
              />
              <div className={css.importSkillInfo}>
                <div className={css.importSkillName}>{skill.name}</div>
                <div className={css.importSkillDesc}>{skill.description}</div>
                <div className={css.importSkillPath}>{skill.path}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Options */}
        <div className={css.importOptions}>
          <label className={css.importOption}>
            <input type="checkbox" checked={selectedCount === skills.length && skills.length > 0} onChange={toggleAll} />
            {selectedCount === skills.length ? '取消全选' : '全选'}
          </label>
          <label className={css.importOption}>
            <select value={target} onChange={(e) => setTarget(e.target.value as 'global' | 'workspace')}>
              <option value="global">{t('import.targetGlobal')}</option>
              <option value="workspace">{t('import.targetWorkspace')}</option>
            </select>
          </label>
          <label className={css.importOption}>
            <input type="checkbox" checked={autoEnable} onChange={() => setAutoEnable(!autoEnable)} />
            {t('import.autoEnable')}
          </label>
          <label className={css.importOption}>
            <input type="checkbox" checked={useSymlink} onChange={() => setUseSymlink(!useSymlink)} />
            创建符号链接而非复制
          </label>
        </div>

        {/* Actions */}
        <div className={css.importActions}>
          <button type="button" className={css.modalBtn} onClick={onClose}>{t('btn.cancel')}</button>
          <button
            type="button"
            className={css.modalBtnPrimary}
            disabled={selectedCount === 0 || importing}
            onClick={doImport}
          >
            {importing ? '...' : t('import.selected', { n: selectedCount })}
          </button>
        </div>
      </div>
    </div>
  )
}
