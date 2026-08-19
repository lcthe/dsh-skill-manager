/**
 * Browser skill manager plugin: registers a settings tab for managing skills.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots/client'
import { en, NS, zh } from './locales.ts'
import { SkillManager } from './SkillManager.tsx'

export const inject = ['slots', 'locale']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-skill-manager: dictionaries')
  ctx.slots.inject('settings.plugins.tab', () =>
    ctx.slots.register(
      { name: 'settings.plugins.tab', id: 'skill-manager', order: 30, locale: NS },
      SkillManager,
    ),
  )
}
