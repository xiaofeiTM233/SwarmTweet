<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 项目协作约定

以下约定在后续所有代码产出与提交中持续生效。

### 一、文件路径注释

- 每个新建或修改的非根目录 ts 代码文件，首行写文件路径注释，格式为 `// app/api/route.ts`，并按该文件语言的单行注释符号调整。
- 路径以项目根目录为基准，使用与实际文件位置完全一致的相对路径；文件被移动或重命名后同步更新该注释。

### 二、注释规范

- 只在重要处写注释，包括关键逻辑、边界条件、特殊处理和容易误解之处；说明为什么这样做，不复述代码字面意思。
- 每条注释单独占一行，紧邻对应代码上方。
- 禁止行内注释，即同一代码行尾的注释。
- 注释禁止多行注释和文档注释，多句说明合并成一句单行注释。
- 注释拒绝文档化写法。
- 拒绝口语化表达（如"这里先这样""随便处理"）。
- 特殊的，在函数行前需要写注释或小文档注释块，可写单行注释解释说明，也可单开 1~4 行写小文档注释块，但不可写分隔行。

### 三、浏览器验证

- 页面验证、截图、交互回归一律使用 MCP 浏览器（magpie-browser）完成。
- 禁止临时写 Playwright 脚本驱动浏览器做验证或截图；仓库自带的 `npm run e2e` 用例属于回归套件，与此限制无关。

### 四、提交规范

- 每完成一个任务或功能就提交一次 commit，不把多个功能攒在同一个提交里。
- 提交标题固定为 `feat: 一句话说明`，一句话概括该次功能改动。
- 描述另起多行，每行以 `- ` 开头，每条一句话，只写重要的功能内容；不写格式调整、琐碎改动或过程性叙述。
- 在提交前需保证已无格式问题和弃用函数弃用参数等不规范内容。
