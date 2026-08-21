# dsh-skills-hub 当前实现说明

## 已实现

- DSH 全局 skills 目录扫描：`~/.dsh/skills/`
- 已注册工作区选择与扫描：`<workspace>/.dsh/skills/`
- 技能名称、描述、Markdown 文件、路径和软链接目标查看
- 搜索技能
- 安全删除目录或软链接
- 从 Codex、Claude Code、ZCode、WorkBuddy、QCoderWork 导入
- 复制或创建目录软链接导入
- 同名技能默认跳过，不覆盖
- 上传本地技能文件夹
- 全局和已注册工作区作为导入目标
- 导入结果摘要和详情弹窗

## 当前限制

- 技能启用/禁用状态不由本插件管理；页面不提供伪持久化开关。
- 不支持编辑技能内容、打开文件夹或新建 Skill 向导。
- 不支持覆盖已有技能；同名目标固定跳过。
- 不支持用户自定义扫描路径。
- 导入预览显示名称、描述和路径，不显示文件大小。
- 工作区列表表示 DSH workspace registry 中的已注册工作区，不等同于单一“当前工作区”。
- 外部来源在来源分组展开时才扫描；刷新会清空旧缓存、选择和展开状态。

## 导入来源

| 来源 | 扫描路径 |
|---|---|
| Codex | `~/.codex/skills/`、`~/.codex/vendor_imports/skills/`、`~/.codex/plugins/cache/*/skills/` |
| Claude Code | `~/.claude/skills/` |
| ZCode | `~/.zcode/skills/`、`~/.zcode/cli/plugins/cache/*/skills/` |
| WorkBuddy | `~/.workbuddy/skills/` |
| QCoderWork | `~/.qcoderwork/skills/` |

## 安全边界

- 技能名称必须符合安全名称格式。
- 导入、上传和删除目标只能是全局目录或已注册工作区目录。
- 上传限制请求体、文件数量、单文件大小和总文件大小。
- 上传先写入临时目录，全部成功后再移动到目标目录；失败会清理临时目录。
- 软链接删除只删除链接本身，不跟随或删除链接目标。
