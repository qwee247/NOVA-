/** 权限码：与 mock 数据中的权限字典保持一致 */
export type PermissionKey =
  | 'dashboard:view'
  | 'user:view'
  | 'user:create'
  | 'user:edit'
  | 'user:delete'
  | 'user:export'
  | 'user:phone'
  | 'role:view'
  | 'role:create'
  | 'role:edit'
  | 'role:delete'
  | 'menu:view'
  | 'menu:create'
  | 'menu:edit'
  | 'menu:delete'

/** 账号状态 */
export type UserStatus = 'enabled' | 'disabled'

/** 登录后的用户快照（含角色展示信息和扁平权限码数组） */
export interface SessionUser {
  id: number
  name: string
  username: string
  role: string
  roleName: string
  avatar: string
  permissions: PermissionKey[]
}

/** 用户管理页的数据行 */
export interface UserRow {
  id: number
  name: string
  username: string
  phone: string
  email: string
  role: string
  status: UserStatus
  department: string
  createdAt: string
  /** 仅新建账号时短暂存在，保存用户时不落库 */
  password?: string
}

/** 角色管理页的数据行 */
export interface RoleRow {
  id: number
  name: string
  key: string
  memberCount: number
  description: string
  status: UserStatus
  permissions: PermissionKey[]
  updatedAt: string
}

/** 登录账号：密码 + 用户快照 */
export interface Account {
  password: string
  user: SessionUser
}

/** 角色权限分组（角色管理表单里的权限树） */
export interface PermissionGroup {
  name: string
  keys: PermissionKey[]
}

export interface MenuRow {
  id: number
  label: string
  path: string
  component: 'dashboard' | 'users' | 'roles' | 'menus'
  permission: PermissionKey
  sort: number
  status: UserStatus
}
export interface AuthResult { token: string; user: SessionUser; menus: MenuRow[] }
