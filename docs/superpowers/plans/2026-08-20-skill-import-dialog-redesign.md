# Skill Import Dialog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the skill import dialog as a wider, theme-aware, collapsed-source browser that only scans an agent's skills when its source group is opened.

**Architecture:** Keep the existing host `/skill-manager-api/detect` and `/skill-manager-api/scan` endpoints unchanged. Refactor the browser dialog into two layers: dynamically detected source groups, each with independent collapsed/expanded state and lazy scan state; and a shared selection model used by the bottom import controls. Use dsh theme variables for the dialog surface, borders, text, and controls so light mode is near-white while dark mode follows dsh automatically.

**Tech Stack:** React + TypeScript, CSS Modules, dsh CSS custom properties, existing same-origin `skillRpc()` transport, browser GUI verification on `http://127.0.0.1:3080/`.

## Global Constraints

- Preserve dynamic source detection from `skillRpc('detect')`; never show hard-coded agent sources that are absent on the host.
- All source groups are collapsed by default; opening a group is the only action that starts `skillRpc('scan', { source })` for that source.
- Keep the main Skill Manager list limited to dsh-owned skills; this plan changes only the import dialog.
- Do not add emoji icons to the import UI.
- Use dsh theme variables instead of fixed gray or white surfaces; light mode should resolve to a near-white dialog background.
- Keep existing import target, auto-enable, symlink, selection, and close/cancel semantics.

---

### Task 1: Refactor ImportDialog state into collapsed source groups

**Files:**
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/ImportDialog.tsx`

**Interfaces:**
- Consumes: existing `skillRpc<T>(endpoint, args)` helper, `ImportDialogProps`, and `ExternalSkill` response shape.
- Produces: source group state with `sources`, `expandedSources`, `scanned`, `scanning`, and one shared `selected` set.

- [ ] **Step 1: Replace the single `activeSource` state with independent group state.**

Use these state shapes:

```ts
const [sources, setSources] = useState<string[]>([])
const [loadingSources, setLoadingSources] = useState(true)
const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
const [scanned, setScanned] = useState<Record<string, ExternalSkill[]>>({})
const [scanning, setScanning] = useState<Record<string, boolean>>({})
const [selected, setSelected] = useState<Set<string>>(new Set())
```

When `detect` resolves, filter out `dsh`, preserve the returned order, and do not add any source to `expandedSources`.

- [ ] **Step 2: Add a lazy group toggle callback.**

Implement:

```ts
const toggleSource = useCallback((source: string) => {
  setExpandedSources((prev) => {
    const next = new Set(prev)
    if (next.has(source)) next.delete(source)
    else next.add(source)
    return next
  })
}, [])
```

Add a separate `scanSource(source)` callback that calls `skillRpc<ExternalSkill[]>('scan', { source })` only when `source` is first expanded. Cache results in `scanned[source]` so collapsing and reopening does not rescan unnecessarily. Set `scanning[source]` during the request and cache an empty list on failure so a failed source does not retry on every render.

- [ ] **Step 3: Keep selection keys collision-safe across sources.**

Use a source-qualified key for the checkbox set, while preserving the skill name in the import payload:

```ts
const selectionKey = (source: string, name: string) => `${source}:${name}`
```

A source-row checkbox selects or clears all skills currently scanned for that source. A top-level “全选” checkbox selects all currently loaded skills across all sources; it must not trigger scans for collapsed groups. The selected count must reflect selected loaded skills only.

- [ ] **Step 4: Preserve current import callback behavior.**

Keep `onImported(selectedCount)` and the current simulated import behavior unchanged for this UI-only pass. Build the selected skill list from the source-qualified selection map so the later real import endpoint can consume it without another component refactor.

---

### Task 2: Build the collapsed source-group markup

**Files:**
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/ImportDialog.tsx`

**Interfaces:**
- Consumes: Task 1 state and callbacks.
- Produces: semantic dialog markup with source rows, nested skill rows, and bottom controls.

- [ ] **Step 1: Replace source tabs with a source-group list.**

Use this hierarchy inside the dialog:

```tsx
<div className={css.importListHeader}>
  <label className={css.importSelectAll}>
    <input ... />
    <span>{t('import.selectAll')}</span>
  </label>
  <span className={css.importSelectedCount}>{t('import.selectedCount', { n: selectedCount, total: discoverableCount })}</span>
</div>

<div className={css.importGroups}>
  {sources.map((source) => (
    <section className={css.importGroup} key={source}>
      <button type="button" className={css.importGroupHeader} onClick={() => toggleSource(source)}>
        <span className={css.importGroupChevron} aria-hidden="true">{expanded ? '⌄' : '›'}</span>
        <span className={css.importGroupName}>{sourceLabel(source, t)}</span>
        <span className={css.importGroupPath}>{sourcePath(source)}</span>
        <span className={css.importGroupCount}>{countLabel}</span>
      </button>
      {expanded && <div className={css.importGroupSkills}>...</div>}
    </section>
  ))}
</div>
```

The group header must remain a real button for keyboard accessibility, but the nested checkbox click must not toggle the group accidentally; stop propagation on checkbox labels if needed.

- [ ] **Step 2: Render nested skills only for expanded groups.**

For an expanded source:

- show a compact “loading” row while its first scan is pending;
- show an empty row if the scan returned no skills;
- otherwise render one checkbox row per skill with name, description, and path;
- use the existing checkbox and text styles, with indentation and a thin vertical guide line to match the supplied reference image.

Collapsed groups must render no skill rows and must not expose stale loading text.

- [ ] **Step 3: Add the reference-style header actions.**

The dialog header should contain:

- title `t('import.title')`;
- a compact scope label `t('import.scopeAll')` (visual only in this pass);
- refresh button that reruns `detect`, clears source expansion/cache/selection, and leaves every group collapsed;
- close button using the existing `onClose` callback.

Use text/ARIA labels rather than emoji-only accessible names. The visible refresh/close glyphs may remain typographic characters if their buttons have localized accessible labels.

- [ ] **Step 4: Reorganize the footer controls.**

Use a two-zone footer:

- left: `发现 N 个可导入技能`, followed by the symlink mode select/control;
- right: import target select and primary import button.

Keep the footer outside the scrollable group list so it remains visible while the skill list scrolls.

---

### Task 3: Restyle the dialog for dsh theme and larger dimensions

**Files:**
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/skill-manager.module.css`
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/ImportDialog.tsx` only if a new class hook is needed

**Interfaces:**
- Consumes: Task 2 class names.
- Produces: a responsive, near-white light-theme dialog and matching dark-theme surface without hard-coded gray backgrounds.

- [ ] **Step 1: Increase dialog dimensions and establish theme surfaces.**

Set the modal panel to approximately:

```css
.importDialog {
  width: min(720px, calc(100vw - 48px));
  max-height: min(720px, calc(100vh - 48px));
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base, #fff));
  color: var(--dsw-alias-label-primary, #111);
  border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.12));
  border-radius: 14px;
  overflow: hidden;
}
```

Do not use the current fixed `#fff`/gray overlay combination for the panel or list. The outer scrim may remain translucent black, while all panel/list surfaces must resolve through dsh variables.

- [ ] **Step 2: Add the reference-style header, list, group, and footer styles.**

Create class rules for `importHeader`, `importHeaderActions`, `importListHeader`, `importGroups`, `importGroup`, `importGroupHeader`, `importGroupChevron`, `importGroupPath`, `importGroupCount`, `importGroupSkills`, `importSkillRow`, `importFooter`, `importFooterSummary`, `importFooterControls`, and `importSymlinkSelect`.

Use restrained spacing: 16–20px panel padding, 44px group headers, 32–36px nested rows, and a 1px border between groups. Use `var(--dsw-alias-bg-layer-1, ...)` only for subtle nested row hover states, not as the main light-theme panel background.

- [ ] **Step 3: Make the layout responsive.**

At viewport widths below 600px:

- reduce panel width to `calc(100vw - 24px)`;
- stack footer summary and controls;
- let source paths truncate with ellipsis;
- keep the skill list scrollable within the panel.

---

### Task 4: Update localized strings and run focused checks

**Files:**
- Modify: `/Volumes/GM7/code/dsh-skill-manager/src/client/locales.ts`

**Interfaces:**
- Consumes: existing locale namespace and `ImportDialog` calls.
- Produces: labels for scope, refresh, close, select-all, selected count, discovery summary, and source/group states.

- [ ] **Step 1: Add Chinese and English keys.**

Add translations for at least:

```ts
'import.scopeAll'
'import.refresh'
'import.close'
'import.selectAll'
'import.selectedCount'
'import.discovered'
'import.sourceSkills'
'import.expand'
'import.collapse'
'import.scanFailed'
```

Use Chinese copy matching the reference style, for example `导入外部 Agent 技能`, `全局`, `发现 {n} 个可导入技能`, `已选 {n}/{total}`; provide equivalent concise English strings.

- [ ] **Step 2: Run static checks and bundle.**

From `/Volumes/GM7/code/dsh-skill-manager` with Node 24.18.0:

```bash
npm run bundle
```

Expected: host and client bundles complete without TypeScript or bundler errors. Verify `lib/client.js` contains the new group class names and no removed tab-only source UI strings.

---

### Task 5: Reinstall and verify in the running dsh web UI

**Files:**
- Generated: `/Volumes/GM7/code/dsh-skill-manager/lib/*`
- Installed copy: `/Users/lzq/.dsh/profiles/web/node_modules/@lcthe/dsh-skill-manager/*`

**Interfaces:**
- Consumes: completed host route/client dialog bundles.
- Produces: verified UI on `http://127.0.0.1:3080/`.

- [ ] **Step 1: Reinstall the local file dependency.**

```bash
rm -rf /Users/lzq/.dsh/profiles/web/node_modules/@lcthe/dsh-skill-manager
cd /Users/lzq/.dsh/profiles/web
pnpm install --config.confirmModulesPurge=false
```

- [ ] **Step 2: Restart dsh on port 3080.**

Stop the existing `pnpm dsh web` process, then run:

```bash
cd /Volumes/GM7/code/deepseek-harness
pnpm dsh web
```

Expected: `dsh web: http://127.0.0.1:3080` with no plugin boot error.

- [ ] **Step 3: Verify the visual and interaction criteria in the browser.**

In Settings → Plugins → Skill Manager → Import, verify:

1. the dialog is visibly wider/taller than the current version;
2. light mode uses a near-white panel matching dsh rather than the current gray panel;
3. all detected sources start collapsed;
4. opening one source scans only that source and reveals its skills;
5. reopening a previously scanned source uses cached results;
6. refresh clears the groups back to collapsed and reruns detection;
7. the footer remains visible while the group list scrolls;
8. selected count and import target remain usable without cramped single-line wrapping;
9. dark mode uses dsh's dark surface variables.

Use the DOM snapshot for semantic checks and a screenshot for visual confirmation of panel size, background, grouping, and footer alignment.

- [ ] **Step 4: Record any browser-only CSS adjustments.**

If dsh's actual theme variables differ from the fallback names above, adjust only the CSS variable fallbacks in `skill-manager.module.css`; do not reintroduce fixed gray panel colors.
