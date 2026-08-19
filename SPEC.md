# dsh-skill-manager

DSH Skill Manager — 集中管理所有 AI Agent 的 Skills

[English](README.md) | [简体中文](README.zh.md)

## 🎯 项目目标

为 DeepSeek Harness (DSH) 提供一个**统一的 Skill 管理界面**,让用户可以在一个地方查看、启用/禁用、删除、导入来自不同 Agent 平台(DSH、Codex、ZCode 等)的 Skills。

## 📋 需求规格 (Spec)

### 1. 核心功能

#### 1.1 Skill 浏览器
- **列表视图**:显示所有已发现的 skills,包括:
  - 名称
  - 来源平台(DSH / Codex / ZCode / 自定义)
  - 存储位置(全局 / 工作区 / 符号链接)
  - 启用状态
  - 简要描述(从 skill 文件中提取)
- **搜索过滤**:按名称、来源、状态筛选
- **排序**:按名称、来源、最近使用排序

#### 1.2 一键操作
- **启用/禁用**:切换 skill 的激活状态(不删除文件)
- **删除**:移除 skill 文件(带确认)
- **打开文件夹**:在文件管理器中定位 skill 目录
- **编辑**:用默认编辑器打开 skill 的 markdown 文件

#### 1.3 跨平台导入
- **Codex Skills 导入**:
  - 自动扫描 `~/.codex/vendor_imports/skills/`
  - 自动扫描 `~/.codex/plugins/cache/*/skills/`
  - 支持选择性导入(勾选要导入的 skills)
  - 导入时自动转换格式(如果需要)
  - 导入后自动注册到 DSH

- **ZCode Skills 导入**:
  - 自动扫描 `~/.zcode/skills/`
  - 自动扫描 `~/.zcode/cli/plugins/cache/*/skills/`
  - 同上

- **自定义路径导入**:
  - 用户指定任意目录路径
  - 支持 glob 模式匹配

#### 1.4 自动发现
- **全局 skills**:扫描 `~/.dsh/skills/`
- **工作区 skills**:扫描当前工作区的 `.dsh/skills/`
- **符号链接**:识别并标记指向其他位置的 symlink
- **副本**:识别并标记完全相同的副本
- **定期检查**:启动时和切换工作区时自动扫描

### 2. UI 设计

#### 2.1 入口
- Settings 页面新增 "Skill Manager" 分区
- 或侧边栏新增 "Skills" 图标

#### 2.2 主界面布局
```
┌─────────────────────────────────────────┐
│ 🔍 搜索 skill...          [全部|已启用|已禁用] │
├─────────────────────────────────────────┤
│ 📦 DSH Skills (5)                       │
│   ✅ coding-agent    [禁用] [删除] [打开]  │
│   ✅ data-analysis   [禁用] [删除] [打开]  │
│   ❌ legacy-tool     [启用] [删除] [打开]  │
│   📎 linked-skill → /path/to/skill       │
│   ...                                   │
├─────────────────────────────────────────┤
│ 📦 Codex Skills (3)                     │
│   📥 [导入全部] [选择导入]               │
│   ✅ github-pr       [禁用] [删除] [打开]  │
│   ...                                   │
├─────────────────────────────────────────┤
│ 📦 ZCode Skills (2)                     │
│   📥 [导入全部] [选择导入]               │
│   ...                                   │
└─────────────────────────────────────────┘
```

#### 2.3 导入对话框
- 显示待导入 skill 的预览(名称、描述、文件列表)
- 复选框选择要导入的 skills
- 目标路径选择(全局 / 当前工作区)
- 导入后自动启用选项

### 3. 技术要求

#### 3.1 插件架构
- **平台**:Web (browser client)
- **类型**:Client-only (不需要 host 半区)
- **槽位**:注册到 `settings.plugins.tab` 或自定义设置分区
- **依赖**:`@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-locale`

#### 3.2 文件系统操作
- 读取 skill 目录和文件
- 创建/删除符号链接
- 复制文件
- 识别文件内容(md 解析)

#### 3.3 数据存储
- 用户配置(启用/禁用状态)存储在 DSH settings
- 最近使用的 skills 列表
- 导入历史

#### 3.4 Skill 文件格式
```markdown
---
name: my-skill
description: 一句话描述
author: 作者名
version: 1.0.0
tags: [coding, review]
---

# My Skill

这里是 skill 的详细说明...
```

### 4. 非功能需求

#### 4.1 性能
- 扫描 1000+ skills 文件 < 1秒
- UI 响应时间 < 100ms

#### 4.2 兼容性
- DSH Desktop + Web
- macOS / Linux / Windows
- DSH 0.1.0-rc.5+

#### 4.3 安全
- 删除操作需二次确认
- 导入操作不执行任何代码
- 符号链接目标验证

### 5. 里程碑

| 阶段 | 内容 | 预计时间 |
|---|---|---|
| M1 | 基础浏览 + 启用/禁用/删除 | 1 周 |
| M2 | Codex/ZCode 导入 | 1 周 |
| M3 | 自动发现 + 符号链接识别 | 3 天 |
| M4 | UI 优化 + 测试 | 3 天 |

### 6. 开放问题

- [ ] Skill 文件格式是否需要标准化?
- [ ] 是否需要 Skill 依赖管理(A 依赖 B)?
- [ ] 是否需要 Skill 版本控制?
- [ ] 是否需要 Skill 市场集成?
- [ ] 导入时是否需要格式转换?

---

*Created: 2026-08-19*
*Author: lcthe*
