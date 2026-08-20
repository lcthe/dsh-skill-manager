import type { ExternalSkill } from './skill-types.ts'
import css from './skill-manager.module.css'

interface SkillDetailDialogProps {
  readonly skill: ExternalSkill
  readonly sourceLabel: string
  readonly t: (key: string, vars?: Record<string, string | number>) => string
  readonly onClose: () => void
}

export function SkillDetailDialog({ skill, sourceLabel, t, onClose }: SkillDetailDialogProps): JSX.Element {
  return (
    <div className={css.modal}>
      <section className={css.detailDialog} role="dialog" aria-modal="true" aria-labelledby="skill-detail-title">
        <header className={css.detailHeader}>
          <div>
            <h3 id="skill-detail-title">{skill.name}</h3>
            <span>{sourceLabel}</span>
          </div>
          <button type="button" className={css.iconButton} aria-label={t('detail.close')} onClick={onClose}>×</button>
        </header>
        <div className={css.detailBody}>
          <dl className={css.detailList}>
            <div>
              <dt>{t('detail.source')}</dt>
              <dd>{sourceLabel}</dd>
            </div>
            <div>
              <dt>{t('detail.path')}</dt>
              <dd className={css.detailPath}>{skill.path}</dd>
            </div>
            <div>
              <dt>{t('detail.description')}</dt>
              <dd className={css.detailDescription}>{skill.description || t('detail.noDescription')}</dd>
            </div>
            <div>
              <dt>{t('detail.files')}</dt>
              <dd>{skill.files.length > 0 ? skill.files.join(', ') : '—'}</dd>
            </div>
            <div>
              <dt>{t('detail.symlink')}</dt>
              <dd>{skill.isSymlink ? t('detail.yes') : t('detail.no')}</dd>
            </div>
            {skill.linkTarget && (
              <div>
                <dt>{t('detail.linkTarget')}</dt>
                <dd className={css.detailPath}>{skill.linkTarget}</dd>
              </div>
            )}
          </dl>
        </div>
        <footer className={css.detailFooter}>
          <button type="button" className={css.modalBtn} onClick={onClose}>{t('detail.close')}</button>
        </footer>
      </section>
    </div>
  )
}
