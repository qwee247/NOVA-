import type { Account, PermissionKey, RoleRow, UserRow } from '../types'

export const permissionLabels: Record<PermissionKey, string> = {
  'dashboard:view': '查看仪表盘',
  'user:view': '查看用户',
  'user:create': '新增用户',
  'user:edit': '编辑用户',
  'user:delete': '删除用户',
  'user:export': '导出用户',
  'user:phone': '查看手机号',
  'role:view': '查看角色',
  'role:create': '新增角色',
  'role:edit': '编辑角色',
  'role:delete': '删除角色',
  'menu:view': '查看菜单',
  'menu:create': '新增菜单',
  'menu:edit': '编辑菜单',
  'menu:delete': '删除菜单',
}

export const allPermissions = Object.keys(permissionLabels) as PermissionKey[]

export const accounts: Record<string, Account> = {
  admin: {
    password: '123456',
    user: {
      id: 1,
      name: '王冰',
      username: 'admin',
      role: 'super_admin',
      roleName: '超级管理员',
      avatar: '冰',
      permissions: allPermissions,
    },
  },
  operator: {
    password: '123456',
    user: {
      id: 2,
      name: '林晓',
      username: 'operator',
      role: 'operator',
      roleName: '运营专员',
      avatar: '林',
      permissions: ['dashboard:view', 'user:view', 'user:export', 'role:view'],
    },
  },
}

export const initialUsers: UserRow[] = [
  { id: 1001, name: '林晓', username: 'linxiao', phone: '186 0271 6042', email: 'linxiao@nova.cn', role: 'operator', status: 'enabled', department: '运营中心', createdAt: '2026-07-18' },
  { id: 1002, name: '陈屿', username: 'chenyu', phone: '138 7132 9081', email: 'chenyu@nova.cn', role: 'super_admin', status: 'enabled', department: '技术中心', createdAt: '2026-07-16' },
  { id: 1003, name: '周宁', username: 'zhouning', phone: '159 2640 1773', email: 'zhouning@nova.cn', role: 'operator', status: 'enabled', department: '产品中心', createdAt: '2026-07-12' },
  { id: 1004, name: '许言', username: 'xuyan', phone: '177 8642 3509', email: 'xuyan@nova.cn', role: 'operator', status: 'disabled', department: '市场中心', createdAt: '2026-07-09' },
  { id: 1005, name: '宋遥', username: 'songyao', phone: '136 6711 4930', email: 'songyao@nova.cn', role: 'operator', status: 'enabled', department: '客户成功', createdAt: '2026-07-05' },
  { id: 1006, name: '杜衡', username: 'duheng', phone: '133 4991 0827', email: 'duheng@nova.cn', role: 'operator', status: 'enabled', department: '数据中心', createdAt: '2026-07-02' },
  { id: 1007, name: '苏澄', username: 'sucheng', phone: '158 7239 1160', email: 'sucheng@nova.cn', role: 'operator', status: 'disabled', department: '运营中心', createdAt: '2026-06-28' },
  { id: 1008, name: '顾川', username: 'guchuan', phone: '139 9552 4301', email: 'guchuan@nova.cn', role: 'operator', status: 'enabled', department: '技术中心', createdAt: '2026-06-25' },
]

export const initialRoles: RoleRow[] = [
  { id: 1, name: '超级管理员', key: 'super_admin', memberCount: 2, description: '拥有系统全部菜单及操作权限', status: 'enabled', permissions: allPermissions, updatedAt: '2026-07-21 10:24' },
  { id: 2, name: '运营专员', key: 'operator', memberCount: 6, description: '负责日常数据查看与用户信息导出', status: 'enabled', permissions: accounts.operator.user.permissions, updatedAt: '2026-07-18 16:40' },
]

export const initialMenus: import('../types').MenuRow[] = [
  { id: 1, label: '数据概览', path: '/dashboard', component: 'dashboard', permission: 'dashboard:view', sort: 1, status: 'enabled' },
  { id: 2, label: '用户管理', path: '/users', component: 'users', permission: 'user:view', sort: 2, status: 'enabled' },
  { id: 3, label: '角色管理', path: '/roles', component: 'roles', permission: 'role:view', sort: 3, status: 'enabled' },
  { id: 4, label: '菜单管理', path: '/menus', component: 'menus', permission: 'menu:view', sort: 4, status: 'enabled' },
]
