/**
 * Host loader entry for the skill manager plugin.
 * Provides filesystem scanning and skill import handlers.
 */
import { readdir, stat, copyFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import type { Context } from '@deepseek-ai/cordis'

export const inject = ['harness']

interface ExternalSkill {
  readonly name: string
  readonly description: string
  readonly source: string
  readonly path: string
  readonly files: readonly string[]
}

/** Scan a directory for skill folders (directories containing *.md). */
async function scanSkillDir(dir: string, source: string): Promise<ExternalSkill[]> {
  const skills: ExternalSkill[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const skillPath = join(dir, entry.name)
      try {
        const files = await readdir(skillPath)
        const mdFiles = files.filter((f) => f.endsWith('.md'))
        if (mdFiles.length === 0) continue
        // Read first .md for description
        const content = await readFile(join(skillPath, mdFiles[0]), 'utf-8').catch(() => '')
        const descMatch = content.match(/^(?:#\s+.+\n\n)?(.{1,200})/m)
        skills.push({
          name: entry.name,
          description: descMatch?.[1]?.trim() ?? '',
          source,
          path: skillPath,
          files: mdFiles,
        })
      } catch { /* skip unreadable */ }
    }
  } catch { /* dir not found */ }
  return skills
}

async function readFile(path: string, encoding: BufferEncoding): Promise<string> {
  const { readFile: rf } = await import('node:fs/promises')
  return rf(path, { encoding })
}

export function apply(ctx: Context): void {
  ctx.harness.handle('skill-manager.scan', async (args: { source: string }) => {
    const home = homedir()
    const sourcePaths: Record<string, string[]> = {
      codex: [join(home, '.codex', 'vendor_imports', 'skills'), join(home, '.codex', 'plugins', 'cache')],
      claude: [join(home, '.claude', 'skills')],
      zcode: [join(home, '.zcode', 'skills'), join(home, '.zcode', 'cli', 'plugins', 'cache')],
      workbuddy: [join(home, '.workbuddy', 'skills')],
      qcoderwork: [join(home, '.qcoderwork', 'skills')],
    }
    const paths = sourcePaths[args.source] ?? []
    const all: ExternalSkill[] = []
    for (const p of paths) {
      const statInfo = await stat(p).catch(() => null)
      if (statInfo?.isDirectory()) {
        all.push(...await scanSkillDir(p, args.source))
      }
      // Also scan subdirectories (for cache-based structures)
      if (statInfo?.isDirectory()) {
        const subs = await readdir(p, { withFileTypes: true }).catch(() => [])
        for (const sub of subs) {
          if (!sub.isDirectory()) continue
          const subPath = join(p, sub.name)
          // Check if it contains a skills/ subdirectory
          const skillsDir = join(subPath, 'skills')
          const sdStat = await stat(skillsDir).catch(() => null)
          if (sdStat?.isDirectory()) {
            all.push(...await scanSkillDir(skillsDir, args.source))
          } else {
            all.push(...await scanSkillDir(subPath, args.source))
          }
        }
      }
    }
    return all
  })

  ctx.harness.handle('skill-manager.import', async (args: { skills: Array<{ name: string; path: string }>; target: string }) => {
    const targetDir = args.target === 'global'
      ? resolve(homedir(), '.dsh', 'skills')
      : resolve(args.target)
    await mkdir(targetDir, { recursive: true })
    let imported = 0
    for (const skill of args.skills) {
      const dest = join(targetDir, skill.name)
      await mkdir(dest, { recursive: true })
      // Copy all files from source skill dir
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
    return { imported, target: targetDir }
  })
}
