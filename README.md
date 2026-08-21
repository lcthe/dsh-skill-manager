# dsh-skills-hub

DSH Skill Manager — 集中管理所有 AI Agent 的 Skills

[English](README.md) | [简体中文](README.zh.md)

## 🎯 项目目标

A browser-based DSH settings page for browsing, searching, inspecting, importing, uploading, and safely deleting skills. The scope selector switches between the global skills directory and registered workspaces.

## ✨ 核心功能

- **Skill browser**: List installed skills with search and details
- **Skill management**: Delete skill directories or symlinks safely
- **Cross-platform import**: Import skills from Codex, Claude Code, ZCode, WorkBuddy, and QCoderWork
- **Local upload**: Upload a skill folder into the global or a registered workspace skills directory
- **Scope selection**: Switch between the global skills directory and registered workspaces

### Screenshots

![Skill List](docs/1.png)

![Import Dialog](docs/2.png)

![Source Selection](docs/3.png)

## 📐 需求规格

详见 [SPEC.md](SPEC.md)

## 🏗️ 技术栈

- DSH Client Plugin (Web)
- React + TypeScript
- CSS Modules
- DSH Slot System

## Install

Requires a DeepSeek Harness deployment with the **browser client** — either the **desktop** app (embedded Web UI) or the **web** version. The skills hub is a browser-facing DSH plugin and appears in **Settings → Skills**.

```sh
pnpm add @lcthe/dsh-skills-hub
```

Then add the plugin row to your `cordis.yml` at the same include level as the bundle rows:

```yaml
- insert:
    - id: dsh-skills-hub
      name: '@lcthe/dsh-skills-hub'
```

Start the DSH web client:

```sh
pnpm dsh web
```

After DSH starts, open **Settings → Skills** to manage installed skills. The plugin scans the DSH skills directory and can discover skills from Codex, Claude Code, ZCode, WorkBuddy, and QCoderWork for import.

### Local development

To load a local checkout instead of the published package, add a `file:` dependency in the DSH profile's `package.json`:

```json
{
  "dependencies": {
    "@lcthe/dsh-skills-hub": "file:/path/to/dsh-skills-hub"
  }
}
```

Then include `@lcthe/dsh-skills-hub` in `dsh.profile.bundles` and rebuild the plugin from the checkout:

```sh
pnpm install
pnpm run build
```


## 🤝 贡献

欢迎提交 Issue 和 PR!

## 📄 License

MIT
