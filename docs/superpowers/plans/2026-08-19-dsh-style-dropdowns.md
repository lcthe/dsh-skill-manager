# DSH 风格下拉框实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将导入窗口底部的“导入方式”和“目标”两个原生下拉框替换为统一的 dsh 风格自定义下拉控件。

**Architecture:** 新增可复用的 `DshDropdown` React 组件，内部管理展开状态、外部点击关闭、键盘导航和选中项渲染。`ImportDialog` 只提供当前值、选项和变更回调，现有 `mode`、`target` 状态及导入/上传 API 保持不变。CSS 使用按钮式触发器、浅色浮层、圆角、阴影和勾选标记，工作区路径只影响展开面板，不撑开关闭状态按钮。

**Tech Stack:** React 18, TypeScript, CSS Modules, tsdown, dsh web browser verification.

## Global Constraints

- 不改变 `mode`、`target` 的值语义：`copy | symlink`、`global | workspace path`。
- 不改变 `/skill-manager-api/import`、`/skill-manager-api/upload` 请求结构。
- 自定义下拉必须支持鼠标点击、Enter/Space、Escape、ArrowUp/ArrowDown、Home/End。
- 点击组件外部关闭菜单；选中项显示勾选标记。
- 保留紧凑按钮宽度：导入方式约 86px，目标约 96px；长工作区路径在面板内省略。
- 使用现有 dsh CSS 变量，不新增第三方依赖。

---

### Task 1: 新增可复用 DshDropdown 组件

**Files:**
- Create: `src/client/DshDropdown.tsx`
- Modify: `src/client/skill-manager.module.css`

**Interfaces:**
- Consumes: `value`, `options`, `onChange`, `ariaLabel`, optional `className`。
- Produces: 可复用的 `DshDropdown` JSX 组件，供 `ImportDialog` 的两个选择器使用。

- [ ] **Step 1: 添加组件类型与基础渲染**

```tsx
export interface DshDropdownOption {
  readonly value: string
  readonly label: string
}

export interface DshDropdownProps {
  readonly value: string
  readonly options: readonly DshDropdownOption[]
  readonly onChange: (value: string) => void
  readonly ariaLabel: string
  readonly className?: string
}
```

组件根节点使用 `position: relative` 的容器，触发器使用 `button type="button"`，菜单使用 `role="listbox"`，每个选项使用 `role="option"`，当前选项设置 `aria-selected="true"`。

- [ ] **Step 2: 实现展开、外部关闭和选择**

使用 `useState(false)` 管理菜单状态，使用 `useRef<HTMLDivElement>` 保存根节点，并在展开时注册 `pointerdown` 文档监听；事件目标不在根节点内时关闭菜单。点击选项时调用 `onChange(option.value)` 并关闭菜单。

- [ ] **Step 3: 实现键盘行为**

触发器支持：

```text
Enter / Space / ArrowDown：打开并聚焦当前选项
Escape：关闭
```

菜单支持：

```text
ArrowDown / ArrowUp：移动高亮项并循环
Home / End：跳到首项或末项
Enter / Space：选择当前高亮项
Escape：关闭并把焦点还给触发器
```

使用选项按钮 refs 在菜单打开后聚焦当前项；没有选项时不打开菜单。

- [ ] **Step 4: 添加 dsh 风格样式**

新增 `.dshDropdown`、`.dshDropdownButton`、`.dshDropdownChevron`、`.dshDropdownMenu`、`.dshDropdownOption`、`.dshDropdownOptionSelected` 等 CSS 类：浅灰按钮背景、8px 圆角、白色浮层、细边框、阴影、选中项勾号和主题 focus ring。菜单向上展开，最大宽度 320px，长文本省略。

- [ ] **Step 5: 运行类型检查和构建**

运行：

```bash
cd /Volumes/GM7/code/dsh-skill-manager
npm run typecheck
npm run bundle
```

预期：类型检查和 bundle 均成功。

---

### Task 2: 替换 ImportDialog 中的两个原生 select

**Files:**
- Modify: `src/client/ImportDialog.tsx`
- Modify: `src/client/skill-manager.module.css`

**Interfaces:**
- Consumes: Task 1 的 `DshDropdown` 和 `DshDropdownOption`。
- Produces: 导入窗口底部两个统一风格的 dsh 下拉框。

- [ ] **Step 1: 引入组件并定义选项**

在 `ImportDialog.tsx` 引入 `DshDropdown`，为导入模式和目标分别传入选项：

```tsx
const modeOptions = [
  { value: 'copy', label: t('import.copy') },
  { value: 'symlink', label: t('import.symlink') },
]
const targetOptions = [
  { value: 'global', label: t('import.globalTarget') },
  ...workspaces.map((path) => ({ value: path, label: path })),
]
```

- [ ] **Step 2: 替换导入方式 select**

保留 `.importSymlinkSelect` 外层标签和文案，将原生 `<select>` 替换为：

```tsx
<DshDropdown
  className={css.dshDropdownMode}
  value={mode}
  options={modeOptions}
  onChange={(value) => setMode(value as 'copy' | 'symlink')}
  ariaLabel={t('import.linkMode')}
/>
```

- [ ] **Step 3: 替换目标 select**

将目标原生 `<select>` 替换为：

```tsx
<DshDropdown
  className={css.dshDropdownTarget}
  value={target}
  options={targetOptions}
  onChange={setTarget}
  ariaLabel={t('import.target')}
/>
```

保持 `doImport` 和 `onPickFolder` 对 `mode`、`target` 的使用不变。

- [ ] **Step 4: 调整底部布局样式**

删除旧原生 select 的 `appearance`、`option` 和箭头背景规则，保留 `.importSymlinkSelect` 的文字与间距规则；使用 `.dshDropdownMode` 和 `.dshDropdownTarget` 设置按钮宽度，避免长工作区路径影响 footer 布局。窄屏时保持现有 footer 换行规则。

- [ ] **Step 5: 重新构建**

运行：

```bash
cd /Volumes/GM7/code/dsh-skill-manager
npm run typecheck
npm run bundle
```

预期：构建成功，`lib/client.js` 更新。

---

### Task 3: 重启 dsh 并进行浏览器验证

**Files:**
- Runtime only: `/Volumes/GM7/code/deepseek-harness`

- [ ] **Step 1: 重启 3080**

停止当前 `pnpm dsh web`，从 `/Volumes/GM7/code/deepseek-harness` 重新启动，并等待 `http://127.0.0.1:3080/` 响应。

- [ ] **Step 2: 验证视觉样式**

打开 Settings → Plugins → Skill Manager → Import，确认：

- “复制”与“全局”都是浅灰圆角按钮；
- 两个按钮右侧都有统一箭头；
- 打开后显示白色圆角浮层和阴影；
- 当前项显示勾选标记；
- 工作区长路径只在浮层内显示并省略，不撑开 footer。

- [ ] **Step 3: 验证交互**

分别验证：

- 点击按钮打开/关闭；
- 选择“软链接”后 `mode` 变为 `symlink`；
- 选择工作区路径后 `target` 变为该路径；
- 点击外部关闭；
- Escape 关闭；
- ArrowUp/ArrowDown 移动并 Enter 选择；
- 选中的技能仍通过现有导入按钮提交，上传仍使用当前 target。

- [ ] **Step 4: 检查最终页面**

刷新页面并确认无控制台错误、无重复菜单、无布局溢出。
