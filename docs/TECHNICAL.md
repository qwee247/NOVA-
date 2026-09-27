# NOVA 技术文档

## 1. 系统定位

NOVA 是一个单页应用（SPA）形式的 RBAC 管理后台演示。浏览器承担页面渲染、路由、状态管理和模拟数据服务；当前没有真实后端、数据库或服务端会话。

核心运行链路如下：

```text
main.ts
  ├─ 注册 Pinia
  ├─ 注册 Vue Router
  ├─ 注册 Element Plus
  └─ 注册 v-permission
       ↓
路由守卫检查登录状态与页面权限
       ↓
AppLayout 按权限生成菜单
       ↓
页面通过 Store 读写内存数据，通过指令/权限码控制操作与字段
```

## 2. 模块职责

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| 应用入口 | `src/main.ts` | 创建 Vue 应用并注册插件、样式和权限指令 |
| 路由层 | `src/router/index.ts` | 声明页面路由；执行登录校验和路由权限校验 |
| 认证状态 | `src/stores/auth.ts` | 登录、退出、Token/用户持久化、权限判断 |
| 业务状态 | `src/stores/data.ts` | 用户和角色的内存 CRUD |
| HTTP 层 | `src/api/http.ts` | Axios 实例、请求 Token 注入、响应错误包装、Mock 登录 |
| 权限指令 | `src/directives/permission.ts` | 无权限时从 DOM 移除元素 |
| Mock 数据 | `src/mock/data.ts` | 账号、权限字典、初始用户和角色 |
| 类型模型 | `src/types.ts` | 会话用户、用户行、角色行和角色键类型 |
| 页面布局 | `src/layouts/AppLayout.vue` | 权限菜单、顶部栏、账号菜单和内容出口 |

## 3. 数据模型

### SessionUser

登录后的用户快照，包含角色展示信息和扁平权限码数组。权限判断使用精确字符串匹配：

```ts
user.permissions.includes(permission)
```

### UserRow

用户管理的数据行，包含姓名、账号、联系方式、部门、角色、状态和创建日期。

### RoleRow

角色管理的数据行，包含角色键、成员数、状态、描述、权限码数组和更新时间。

`RoleKey` 当前被限制为 `super_admin | operator`。如果要让界面支持任意新角色，应将它调整为后端返回的字符串类型或独立角色实体引用，并同步修改用户表单与角色名称映射。

## 4. 认证流程

1. 登录页调用 `auth.login(username, password)`。
2. Store 向 `/auth/login` 发起 Axios 请求。
3. 自定义 Axios adapter 从 `accounts` 查找账号并模拟约 350 ms 延迟。
4. 成功后生成演示 Token，并把 Token 与用户快照写入 Pinia 和 `localStorage`。
5. 后续请求由请求拦截器添加 `Authorization: Bearer <token>`。
6. 路由守卫依据 Token 与用户快照判断是否已登录。
7. 退出登录清理状态并跳转 `/login`。

当前 Mock adapter 对错误登录直接返回状态为 401 的普通响应对象。接入真实后端后，Axios 会对非 2xx 响应进入响应拦截器的错误分支。

## 5. 权限设计

### 权限码

| 模块 | 权限码 | 用途 |
| --- | --- | --- |
| 概览 | `dashboard:view` | 查看数据概览 |
| 用户 | `user:view` | 查看用户页面 |
| 用户 | `user:create` | 新增用户 |
| 用户 | `user:edit` | 编辑用户 |
| 用户 | `user:delete` | 单个或批量删除用户 |
| 用户 | `user:export` | 导出 Excel |
| 用户 | `user:phone` | 查看手机号字段 |
| 角色 | `role:view` | 查看角色页面 |
| 角色 | `role:create` | 新增角色 |
| 角色 | `role:edit` | 编辑角色和权限 |
| 角色 | `role:delete` | 删除非超级管理员角色 |

### 三个控制层级

- 路由级：路由 `meta.permission` 由全局前置守卫检查，无权限跳转 `/403`。
- 按钮级：模板使用 `v-permission="'user:create'"`，指令在挂载时移除无权限元素。
- 字段级：页面主动调用 `auth.can('user:phone')` 决定展示手机号还是保护提示；导出时执行同样判断。

侧边栏菜单也使用权限码过滤，因此不可访问的模块不会出现。

### 安全边界

这些检查全部运行在浏览器中，用户可以修改本地代码、存储或请求。真实系统必须在服务端对每个接口重新完成身份验证、资源授权和字段过滤；前端权限只负责用户体验，不能视作安全边界。

## 6. 路由表

| 路径 | 页面 | 是否公开 | 权限 |
| --- | --- | --- | --- |
| `/login` | 登录 | 是 | 无 |
| `/dashboard` | 数据概览 | 否 | `dashboard:view` |
| `/users` | 用户管理 | 否 | `user:view` |
| `/roles` | 角色管理 | 否 | `role:view` |
| `/403` | 无权访问 | 否 | 无 |

未知路径重定向到 `/dashboard`。已登录用户访问 `/login` 也会跳转到 `/dashboard`。

## 7. 状态与数据生命周期

- 认证 Store 初始化时从 `localStorage` 读取 `nova-token` 与 `nova-user`，因此刷新后仍保持登录。
- 数据 Store 使用 `structuredClone` 复制 Mock 初始数组，CRUD 不会直接改写源常量。
- 用户和角色修改没有写入本地存储或服务器，页面刷新即重置。
- 新记录使用 `Date.now()` 作为演示 ID；生产系统应使用服务端 ID。
- 仪表盘中的访问量、趋势和最近动态为静态演示数据，用户/角色数量及活跃用户数来自 Store。

## 8. Mock API

Axios 实例配置：

```text
baseURL: /api
timeout: 8000 ms
adapter: mockAdapter
```

### POST `/auth/login`

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

成功响应核心字段：

```json
{
  "token": "nova-admin-token",
  "user": {
    "username": "admin",
    "role": "super_admin",
    "permissions": ["dashboard:view"]
  }
}
```

除登录外的请求当前统一返回 `{ "success": true }`，用户和角色 CRUD 实际由 Pinia Store 完成。

## 9. 接入真实后端

建议按以下顺序改造：

1. 删除 `http.ts` 中的 `mockAdapter`，通过环境变量设置 `baseURL`。
2. 让登录接口返回短期访问 Token，并根据安全要求使用刷新 Token 或 HttpOnly Cookie。
3. 增加“获取当前用户/权限”接口，避免长期信任 `localStorage` 中的用户快照。
4. 把 `data.ts` 的 CRUD 改成异步 API 调用，并处理加载、错误、空状态和并发更新。
5. 让角色、权限和部门选项从后端获取，移除页面中的硬编码枚举。
6. 在服务端实现接口权限、数据范围权限、字段脱敏和审计日志。
7. 对 401 统一清理会话并跳转登录，对 403 保留登录态并进入无权页面。

推荐的环境变量示例：

```dotenv
VITE_API_BASE_URL=/api
```

Vite 客户端环境变量会被打包到浏览器，不能存放密钥。

## 10. 开发约定

### 新增受保护页面

1. 在 `src/views/` 新建页面组件。
2. 在路由子项中配置 `meta.title` 和 `meta.permission`。
3. 在 `AppLayout.vue` 菜单数组加入相同权限码。
4. 在 `permissionLabels` 和角色权限分组中登记权限码。
5. 为演示账号或后端角色分配该权限。

### 新增操作权限

在权限字典中登记权限码，并在按钮上使用 `v-permission`：

```vue
<el-button v-permission="'order:approve'">审批</el-button>
```

如果元素的可见性会在同一挂载周期内动态变化，当前指令不会自动重新插入已移除节点。此类场景优先使用 `v-if="auth.can(...)"`，或扩展指令的 `updated` 生命周期。

## 11. 构建、质量与部署

```bash
pnpm typecheck
pnpm build
pnpm preview
```

`build` 会先执行 `vue-tsc -b`，再由 Vite 输出到 `dist/`。部署服务器需配置 SPA fallback 到 `index.html`。

当前构建会提示主 JavaScript chunk 超过 500 kB。后续可通过路由懒加载、Element Plus 按需导入、拆分 `xlsx`（仅导出时动态加载）以及 Rollup `manualChunks` 降低首屏体积。

## 12. 已知限制

- 无真实后端、数据库、刷新 Token 或服务端授权。
- “记住我”复选框目前只展示，登录状态始终写入 `localStorage`。
- 忘记密码、通知、全部动态和操作审计为界面演示，没有业务实现。
- 搜索输入后按 Enter 才显式回到第一页；切换筛选项时未统一重置页码。
- 新建角色的 `key` 类型仍受两个固定角色键限制。
- 数据概览的日期和部分统计为静态样例。
- 没有自动化测试、国际化和可访问性专项测试。

## 13. 建议测试清单

- 两个账号均能登录，错误账号或密码显示提示。
- 未登录直接访问受保护路径会跳转登录，并在登录后返回原路径。
- 运营专员看不到新增、编辑和删除按钮，手机号不直接显示且导出文件中同样受保护。
- 超级管理员能完成用户和角色 CRUD，并看到即时统计变化。
- 删除操作取消时数据不变，确认后列表和数量同步更新。
- 刷新页面后登录态保留，业务数据恢复为 Mock 初始值。
- 直接访问部署环境的 `/users` 不返回服务器 404。
