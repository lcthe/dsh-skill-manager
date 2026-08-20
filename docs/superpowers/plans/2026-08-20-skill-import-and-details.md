# Skill Import and Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make external skill import write real global dsh skills safely and let users open skill details without altering selection.

**Architecture:** Extend the existing same-origin `/skill-manager-api` host route with a guarded `import` endpoint. It validates every request against a freshly scanned source list, then either copies an entire skill directory or creates a directory symlink in `~/.dsh/skills`, never overwriting an existing destination. The React import dialog keeps checkbox selection isolated from a detail-button action, shows a result summary after import, and asks its parent to refresh the dsh skill list.

**Tech Stack:** Node.js filesystem APIs, React + TypeScript, CSS Modules, existing `skillRpc()` fetch helper, pnpm 11.7.0.

## Global Constraints

- Destination is global `~/.dsh/skills` only; do not present a workspace target until a real workspace-path service exists.
- Accept only source/name tuples present in a fresh `scanSource(source)` result; reject path values supplied by the browser.
- Never overwrite, delete, or merge an existing destination directory; report it as skipped.
- Copy preserves nested directories and files; symlink mode creates a directory symlink to the source root.
- Clicking a skill’s details must not affect its checkbox state.

---

### Task 1: Add safe host import endpoint

**Files:**
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/index.ts`

**Interfaces:**
- Consumes: `scanSource(source): ExternalSkill[]`, `SOURCE_PATHS`, Node filesystem APIs.
- Produces: `POST /skill-manager-api/import` accepting `{ mode: 'copy' | 'symlink', skills: Array<{ source: string, name: string }> }` and returning `{ imported: string[], skipped: string[], failed: Array<{ name: string, message: string }> }`.

- [ ] Validate `mode` and a bounded `skills` array.
- [ ] Rescan every requested source; resolve each item by `name` from scan output only.
- [ ] Create `~/.dsh/skills` if absent.
- [ ] Skip an item when `~/.dsh/skills/<name>` exists.
- [ ] On `copy`, call `cpSync(source.path, destination, { recursive: true, dereference: false, errorOnExist: true })`.
- [ ] On `symlink`, call `symlinkSync(source.path, destination, 'dir')`.
- [ ] Catch errors per item so one bad skill does not cancel other selected imports.

### Task 2: Separate selection and skill details in ImportDialog

**Files:**
- Create: `/Volumes/GM7/code/dsh-skill-manager/src/client/SkillDetailDialog.tsx`
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/ImportDialog.tsx`
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/skill-manager.module.css`

**Interfaces:**
- Consumes: `ExternalSkill` fields (`name`, `source`, `path`, `description`, `files`, `isSymlink`, `linkTarget`) and `skillRpc('import', ...)`.
- Produces: detail dialog and truthful import result UI.

- [ ] Replace each skill-row `<label>` with a non-selecting content button plus an adjacent checkbox input.
- [ ] Add `selectedDetail: ExternalSkill | null` state and render `SkillDetailDialog` when non-null.
- [ ] Detail dialog displays name, localized source name, full source path, complete description, all Markdown files, symlink status and target, and a close button.
- [ ] Replace simulated 400ms import with `skillRpc('import', { mode, skills })`.
- [ ] After a successful response, preserve the dialog, clear imported selections, display imported/skipped/failed outcome, and call `onImported(imported.length)` so the parent refreshes its list.
- [ ] Remove the workspace target selector; keep a visible global target label.

### Task 3: Add locale copy and styles

**Files:**
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/locales.ts`
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/skill-manager.module.css`

**Interfaces:**
- Produces: Chinese and English copy for details, import results, global target, imported/skipped/failed counts, symlink fields, and errors.

- [ ] Add `import.globalTarget`, `import.result`, `import.imported`, `import.skipped`, `import.failed`, `detail.title`, `detail.source`, `detail.path`, `detail.description`, `detail.files`, `detail.symlink`, `detail.linkTarget`, and `detail.close` in both dictionaries.
- [ ] Style detail dialog with the existing theme surface/border tokens; use an independently scrollable content area for long descriptions and file lists.
- [ ] Style skill content buttons as text rows with no button chrome, preserving hover affordance while leaving the checkbox independent.
- [ ] Style import results as clear success/warning/error summary rows.

### Task 4: Build, install, and verify

**Files:**
- Generated: `/Volumes/GM7/code/dsh-skill-manager/lib/*`
- Installed: `/Users/lzq/.dsh/profiles/web/node_modules/@lcthe/dsh-skill-manager/*`

- [ ] Run `npm run bundle` from the plugin repository with Node 24.18.0 and pnpm 11.7.0.
- [ ] Reinstall the profile’s `file:` dependency using pnpm 11.7.0.
- [ ] Restart `pnpm dsh web` on 3080.
- [ ] Verify API import with a disposable test skill or a preexisting target that yields a skip; do not overwrite any existing skill.
- [ ] In the browser, verify clicking a skill text opens details without changing its checkbox; confirm checkbox selection only changes on checkbox interaction.
- [ ] Verify copied or symlinked test import appears on the refreshed dsh main list and detail/result counts match the filesystem.
