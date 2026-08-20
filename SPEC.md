# dsh-skills-hub

DSH Skill Manager — 集中管理所有 AI Agent 的 Skills

[English](README.md) | [简体中文](README.zh.md)

## 🎯 项目目标

为 DeepSeek Harness (DSH) 提供一个**统一的 Skill 管理界面**,让用户在一个地方管理 DSH 本身的 skills,并从其他 Agent 平台(Codex、Claude Code、ZCode、WorkBuddy、QCoderWork 等)一键导入。

## 📐 界面布局(参考)

```
┌──────────────────────────────────────────────────┐
│ 技能                                              │
│ [🖥 用户 ▾]    技能 32          🔍 搜索技能...    │
├──────────────────────────────────────────────────┤
│ 已安装 19              [... ] [↻] [+ 新建] [📥 导入] │
├──────────────────────────────────────────────────┤
│ 📋 brainstorming                                 │
│    You MUST use this before any creative work... │
│                                         [🔘] [🗑] │
├──────────────────────────────────────────────────┤
│ 📋 cms-dual-repo-sync                            │
│    当需要比较 DxCMS 与 yfy 的差异...              │
│                                         [🔘] [🗑] │
├──────────────────────────────────────────────────┤
│ 📋 design-taste-frontend                         │
│    Anti-slop frontend skill for landing pages... │
│                                         [🔘] [🗑] │
├──────────────────────────────────────────────────┤
│ ...更多 skills...                                 │
└──────────────────────────────────────────────────┘

点击 [📥 导入] → 弹出导入对话框:
┌──────────────────────────────────────────────┐
│ 导入 Skills                                  │
│ 来源: [Codex ▾] [Claude Code] [ZCode] [...] │
├──────────────────────────────────────────────┤
│ ☑ brainstorming    codex/vendor_imports/...  │
│ ☑ github-pr        codex/plugins/cache/...  │
│ ☐ legacy-tool      zcode/skills/...         │
│ ☑ image-to-code    zcode/skills/...         │
├──────────────────────────────────────────────┤
│ 目标: [全局 ~/.dsh/skills ▾]                 │
│ ☑ 导入后自动启用                              │
│                    [取消]        [导入 3 个]   │
└──────────────────────────────────────────────┘
```

## 📋 需求规格 (Spec)

### 1. 主界面 — Skill 浏览器

#### 1.1 页面结构
- **标题栏**:显示"技能"标题
- **筛选区**:
  - 来源下拉:用户(全部) / DSH / Codex / Claude Code / ZCode / WorkBuddy / QCoderWork
  - 技能计数:显示当前筛选结果数量
  - 搜索框:按名称/描述搜索
- **操作栏**:
  - 已安装计数
  - `更多(...)` 按钮:批量操作
  - `刷新` 按钮:重新扫描
  - `+ 新建` 按钮:创建新 skill
  - `导入` 按钮:打开导入对话框
- **Skill 列表**:每行显示一个 skill

#### 1.2 Skill 行
每行包含:
- **图标**:skill 类型图标
- **名称**:skill 名称(可点击查看详情)
- **描述**:一句话描述(截断显示)
- **启用开关**:Toggle 按钮,切换启用/禁用
- **删除按钮**:垃圾桶图标,点击删除(需确认)

#### 1.3 操作
- **启用/禁用**:切换 skill 的激活状态(不删除文件)
- **删除**:移除 skill 文件(弹出确认对话框)
- **详情**:点击名称展开详情(完整描述、文件列表、来源信息)
- **编辑**:在详情中打开编辑

### 2. 导入对话框

#### 2.1 来源选择
支持的 Agent 平台:

| 平台 | 扫描路径 |
|---|---|
| **Codex** | `~/.codex/vendor_imports/skills/` |
|  | `~/.codex/plugins/cache/*/skills/` |
| **Claude Code** | `~/.claude/skills/` |
| **ZCode** | `~/.zcode/skills/` |
|  | `~/.zcode/cli/plugins/cache/*/skills/` |
| **WorkBuddy** | `~/.workbuddy/skills/` |
| **QCoderWork** | `~/.qcoderwork/skills/` |
| **自定义路径** | 用户指定任意目录 |

#### 2.2 选择界面
- 显示每个来源的 skills 列表
- 每个 skill 有复选框
- 支持"全选/取消全选"
- 显示 skill 预览(名称、描述、文件大小)

#### 2.3 导入选项
- **目标路径**:全局(`~/.dsh/skills/`) 或当前工作区
- **导入后启用**:是否自动启用导入的 skills
- **覆盖已有**:如果同名 skill 已存在,是否覆盖
- **创建符号链接**:而非复制文件(节省空间)

### 3. 自动发现

#### 3.1 扫描范围
启动时和切换工作区时自动扫描:

| 位置 | 说明 |
|---|---|
| `~/.dsh/skills/` | DSH 全局 skills |
| `<workspace>/.dsh/skills/` | 工作区 skills |
| `~/.codex/vendor_imports/skills/` | Codex 内置 skills |
| `~/.codex/plugins/cache/*/skills/` | Codex 插件 skills |
| `~/.zcode/skills/` | ZCode skills |
| `~/.zcode/cli/plugins/cache/*/skills/` | ZCode 插件 skills |

#### 3.2 文件识别
- **Skill 目录**:包含 `*.md` 或 `SKILL.md` 的文件夹
- **符号链接**:标记为 📎,显示链接目标
- **副本**:标记为 📄,显示相同文件的位置
- **嵌套 skill**:支持 skill 内包含子 skill

### 4. 新建 Skill

#### 4.1 创建向导
- 输入名称、描述、作者
- 选择模板(空白 / 代码审查 / 文档生成 / 自定义)
- 选择存储位置(全局 / 工作区)
- 自动生成 `SKILL.md` 文件

#### 4.2 Skill 文件格式
```markdown
---
name: my-skill
description: 一句话描述
author: 作者名
version: 1.0.0
tags: [coding, review]
---

# My Skill

## 使用场景
...

## 指令
...
```

### 5. 技术架构

#### 5.1 插件结构
- **平台**:Web (browser client)
- **类型**:Client-only
- **槽位**:Settings 页面分区 或 自定义设置入口
- **依赖**:DSH Client packages

#### 5.2 数据流
```
用户操作 → UI 组件 → 文件系统 API → skill 文件
                ↓
           DSH Settings (启用/禁用状态)
```

#### 5.3 状态管理
- **已安装 skills**:从文件系统实时读取
- **启用/禁用状态**:存储在 DSH settings
- **导入历史**:记录导入来源和时间

### 6. 里程碑

| 阶段 | 内容 | 预计 |
|---|---|---|
| M1 | 主界面:skill 列表 + 搜索 + 启用/禁用/删除 | 1 周 |
| M2 | 导入对话框:多平台扫描 + 选择导入 | 1 周 |
| M3 | 自动发现 + 符号链接/副本识别 | 3 天 |
| M4 | 新建 skill 向导 + UI 优化 | 3 天 |

### 7. 开放问题

- [ ] Skill 文件格式是否需要标准化?
- [ ] 是否需要 Skill 依赖管理?
- [ ] 是否需要 Skill 版本控制?
- [ ] 是否需要 Skill 市场集成?
- [ ] 导入时是否需要格式转换?

---

*Created: 2026-08-19*
*Author: lcthe*
