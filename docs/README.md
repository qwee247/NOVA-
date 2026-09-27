# NOVA — Vue 3 RBAC 后台管理系统

NOVA 是一个前后端分离风格的 RBAC（基于角色的访问控制）后台演示项目。项目使用 Vue 3、TypeScript、Vite、Pinia、Vue Router 和 Element Plus，实现登录认证、三级权限控制、用户管理、角色管理与 Excel 导出。

> 当前版本使用前端 Mock 数据，不需要启动后端或数据库，适合功能演示、界面原型和 RBAC 方案参考。

## 功能概览

- 登录认证：模拟 Token 签发、持久化、自动注入和异常提示
- 页面权限：路由守卫根据权限码允许访问或跳转至 403
- 菜单权限：侧边栏只展示当前账号可访问的模块
- 操作权限：`v-permission` 指令控制新增、编辑、删除、导出等按钮
- 字段权限：无 `user:phone` 权限时隐藏手机号
- 用户管理：搜索、筛选、分页、新增、编辑、单个/批量删除
- 角色管理：新增、编辑、删除以及权限项配置
- 数据导出：将筛选后的用户数据导出为 `.xlsx`
- 数据概览：用户、角色、活跃用户和访问趋势演示

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3.5、TypeScript 5.9 |
| 构建 | Vite 6 |
| UI | Element Plus、Element Plus Icons、Sass |
| 状态与路由 | Pinia 3、Vue Router 4 |
| 网络与 Mock | Axios 自定义适配器 |
| 文件导出 | SheetJS (`xlsx`) |
| 包管理 | pnpm |

## 环境要求

- Node.js：建议 20 或 22 LTS
- pnpm：建议 10 或更高版本

Windows PowerShell 如果提示禁止运行 `pnpm.ps1`，可以将下列命令中的 `pnpm` 替换成 `pnpm.cmd`。

## 快速开始

```bash
pnpm install
pnpm dev
```

浏览器访问：<http://localhost:5173>

开发服务器监听 `0.0.0.0:5173`，同一局域网内也可通过本机 IP 访问。

## 演示账号

| 账号 | 密码 | 角色 | 能力 |
| --- | --- | --- | --- |
| `admin` | `123456` | 超级管理员 | 全部页面、操作和字段权限 |
| `operator` | `123456` | 运营专员 | 查看概览、用户和角色；导出用户；不可增删改，手机号脱敏 |

## 常用命令

```bash
# 启动开发服务器
pnpm dev

# TypeScript 类型检查
pnpm typecheck

# 类型检查并生成生产文件到 dist/
pnpm build

# 本地预览生产构建
pnpm preview
```

## 使用说明

1. 使用任一演示账号登录。
2. 在“用户管理”中通过关键词、角色或状态筛选数据；超级管理员可以维护用户，两个账号均可按权限导出数据。
3. 在“角色管理”中查看权限分组；超级管理员可修改角色权限或新建角色。
4. 退出登录会删除浏览器 `localStorage` 中的 `nova-token` 和 `nova-user`。

用户、角色和菜单的增删改通过 Axios Mock 接口持久化到浏览器 `localStorage`，便于模拟前后端分离联调；登录状态会保存在浏览器本地，直至主动退出或清理站点数据。Apifox 可直接导入 `docs/apifox.openapi.json`。

## 项目结构

```text
src/
├─ api/http.ts              # Axios 实例、Token 注入和 Mock 登录适配器
├─ directives/permission.ts # 按钮级权限指令
├─ layouts/AppLayout.vue    # 后台整体布局与权限菜单
├─ mock/data.ts             # 演示账号、用户、角色和权限字典
├─ router/index.ts          # 路由表与认证/授权守卫
├─ stores/                  # 登录状态和业务数据状态
├─ styles/index.scss        # 全局样式
├─ views/                   # 登录、概览、用户、角色和 403 页面
├─ App.vue
├─ main.ts
└─ types.ts
```

更完整的架构、权限流程、Mock 接口和二次开发说明见 [技术文档](docs/TECHNICAL.md)。

## 构建与部署

执行 `pnpm build` 后，将 `dist/` 目录部署到任意静态文件服务器。项目采用 HTML5 History 路由，服务器必须把未匹配的前端路径回退到 `index.html`，否则直接访问 `/users` 等路径会返回 404。

生产接入前还应完成：替换 Mock API、服务端鉴权、持久化存储、输入校验、审计日志和按需加载优化。本项目的前端权限控制仅用于界面和流程演示，不能代替服务端授权。

