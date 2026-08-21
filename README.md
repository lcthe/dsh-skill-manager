# dsh-skills-hub

DSH Skill Manager — 集中管理所有 AI Agent 的 Skills

[English](README.md) | [简体中文](README.zh.md)

## 🎯 项目目标

为 DeepSeek Harness (DSH) 提供一个**统一的 Skill 管理界面**,让用户可以在一个地方查看、启用/禁用、删除、导入来自不同 Agent 平台(DSH、Codex、ZCode 等)的 Skills。

## ✨ 核心功能

- **Skill 浏览器**:列表展示所有已发现的 skills,支持搜索过滤
- **一键操作**:启用/禁用、删除、打开文件夹、编辑
- **跨平台导入**:从 Codex、ZCode 等平台一键导入 skills
- **自动发现**:扫描全局/工作区/符号链接的 skills

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
