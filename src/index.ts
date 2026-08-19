/**
 * Host loader entry for the skill manager plugin.
 * Provides filesystem scanning and skill import handlers.
 */
import { readdir, stat, copyFile, mkdir, readlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import type { Context } from '@deepseek-ai/cordis'

export const inject = ['harness']

export interface ExternalSkill {
  readonly name: string
  readonly description: string
  readonly source: string
  readonly path: string
  readonly files: readonly string[]
  readonly isSymlink: boolean
  readonly linkTarget?: string
}

/** Scan a directory for skill folders (directories containing *.md). */
async function scanSkillDir(dir: string, source: string): Promise<ExternalSkill[]> {
  const skills: ExternalSkill[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
      const skillPath = join(dir, entry.name)
      try {
        const entryStat = await stat(skillPath)
        const isSymlink = entry.isSymbolicLink()
        let linkTarget: string | undefined
        if (isSymlink) {
          try { linkTarget = await readlink(skillPath) } catch { /* ignore */ }
        }
        const files = await readdir(skillPath)
        const mdFiles = files.filter((f) => f.endsWith('.md'))
        if (mdFiles.length === 0) continue
        const content = await import('node:fs/promises').then((m) => m.readFile(join(skillPath, mdFiles[0]), 'utf-8')).catch(() => '')
        const descMatch = content.match(/^(?:#\s+.+\n\n)?(.{1,200})/m)
        skills.push({
          name: entry.name,
          description: descMatch?.[1]?.trim() ?? '',
          source,
          path: skillPath,
          files: mdFiles,
          isSymlink,
          linkTarget,
        })
      } catch { /* skip unreadable */ }
    }
  } catch { /* dir not found */ }
  return skills
}

/** Scan external agent platforms for skills. */
async function scanExternal(source: string): Promise<ExternalSkill[]> {
  const home = homedir()
  const sourcePaths: Record<string, string[]> = {
    codex: [join(home, '.codex', 'vendor_imports', 'skills'), join(home, '.codex', 'plugins', 'cache')],
    claude: [join(home, '.claude', 'skills')],
    zcode: [join(home, '.zcode', 'skills'), join(home, '.zcode', 'cli', 'plugins', 'cache')],
    workbuddy: [join(home, '.workbuddy', 'skills')],
    qcoderwork: [join(home, '.qcoderwork', 'skills')],
  }
  const paths = sourcePaths[source] ?? []
  const all: ExternalSkill[] = []
  for (const p of paths) {
    const pStat = await stat(p).catch(() => null)
    if (!pStat?.isDirectory()) continue
    all.push(...await scanSkillDir(p, source))
    // Scan subdirectories (cache-based structures)
    const subs = await readdir(p, { withFileTypes: true }).catch(() => [])
    for (const sub of subs) {
      if (!sub.isDirectory()) continue
      const subPath = join(p, sub.name)
      const skillsDir = join(subPath, 'skills')
      const sdStat = await stat(skillsDir).catch(() => null)
      if (sdStat?.isDirectory()) {
        all.push(...await scanSkillDir(skillsDir, source))
      } else {
        all.push(...await scanSkillDir(subPath, source))
      }
    }
  }
  return all
}

export function apply(ctx: Context): void {
  ctx.harness.handle('skill-manager.scan', async (args: { source: string }) => {
    return scanExternal(args.source)
  })

  ctx.harness.handle('skill-manager.scanAll', async () => {
    const sources = ['codex', 'claude', 'zcode', 'workbuddy', 'qcoderwork']
    const all: ExternalSkill[] = []
    for (const s of sources) all.push(...await scanExternal(s))
    return all
  })

  ctx.harness.handle('skill-manager.import', async (args: { skills: Array<{ name: string; path: string; isSymlink?: boolean }>; target: string; useSymlink?: boolean }) => {
    const targetDir = args.target === 'global'
      ? resolve(homedir(), '.dsh', 'skills')
      : resolve(args.target)
    await mkdir(targetDir, { recursive: true })
    let imported = 0
    for (const skill of args.skills) {
      const dest = join(targetDir, skill.name)
      if (args.useSymlink) {
        // Create symlink instead of copying
        try {
          await mkdir(join(dest, '..'), { recursive: true })
          // Remove existing if present
          const existingStat = await stat(dest).catch(() => null)
          if (existingStat) continue
          const { symlink } = await import('node:fs/promises')
          await symlink(skill.path, dest, 'dir')
          imported++
        } catch { /* skip */ }
      } else {
        await mkdir(dest, { recursive: true })
        const files = await readdir(skill.path).catch(() => [])
        for (const file of files) {
          const src = join(skill.path, file)
          const dst = join(dest, file)
          const srcStat = await stat(src).catch(() => null)
          if (srcStat?.isFile()) {
            await copyFile(src, dst)
            imported++
          }
        }
      }
    }
    return { imported, target: targetDir }
  })
}
