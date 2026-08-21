# Skills Hub Reliability Improvements Implementation Plan

**Goal:** Remove misleading UI promises, harden uploads, make build checks reliable, clarify workspace semantics, and make external-source import lazy and refresh-safe.

**Architecture:** Keep the existing same-origin host API and React client. Remove the non-persistent enable toggle rather than inventing a second state store. Validate and stage uploads in a temporary directory before an atomic rename. Keep workspace targets as registered workspace paths, and make source scanning happen only when a group is expanded.

**Tech Stack:** TypeScript, React 18, tsdown, Node.js filesystem APIs, DSH webServer/workspaceRegistry.

## Global Constraints

- Modify only `/Volumes/GM7/code/dsh-skills-hub`.
- Do not modify or commit `deepseek-harness`.
- Preserve copy/symlink import behavior and same-name skip behavior.
- Preserve symlink-safe deletion semantics.
- Keep `pnpm run bundle` and npm packaging functional.

## Tasks

1. Remove the in-memory enable/disable control from `SkillManager` and update README/SPEC/locales to describe only implemented behavior.
2. Harden `importUploadedSkill` with bounded request parsing, valid Base64 checks, valid-file checks, temporary-directory staging, cleanup on failure, and atomic destination commit.
3. Repair TypeScript configuration/dependencies and make `build` run typecheck before bundle, or explicitly narrow typecheck scope where DSH private runtime types cannot be resolved.
4. Rename UI copy from “current workspace” to “registered workspace”/“workspace” and update README/SPEC and locale keys.
5. Refactor `ImportDialog.detectSources` to detect only, scan on expand, and clear expanded/scanned/selected/error/result state on refresh.
6. Build, typecheck, run API boundary checks, inspect the npm pack, and report any remaining limitations.
