import { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios'
import { accounts, initialMenus, initialRoles, initialUsers, allPermissions } from './data'
import type { Account, MenuRow, RoleRow, SessionUser, UserRow } from '../types'
const read = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? structuredClone(fallback) } catch { return structuredClone(fallback) }
}
const save = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))
export const mockAdapter: AxiosAdapter = async config => {
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  const respond = (data: unknown, status = 200) => ({ data, status, statusText: String(status), headers: new AxiosHeaders(), config })
  const fail = (message: string, status = 400): never => { throw new AxiosError(message, String(status), config, undefined, respond({ message }, status)) }
  const users = read<UserRow[]>('nova-users', [...Object.values(accounts).map(a => ({ id: a.user.id, name: a.user.name, username: a.user.username, role: a.user.role, phone: '', email: `${a.user.username}@nova.cn`, department: '管理中心', status: 'enabled' as const, createdAt: '2026-07-01' })), ...initialUsers])
  const roles = read<RoleRow[]>('nova-roles', initialRoles)
  const menus = read<MenuRow[]>('nova-menus', initialMenus)
  const credentials = read<Record<string, Account>>('nova-accounts', accounts)
  const sessions = read<Record<string, string>>('nova-sessions', {})
  const current = (username: string): SessionUser => {
    const row = users.find(u => u.username === username)
    if (!row || row.status !== 'enabled') return fail('账号不存在或已禁用', 401)
    const role = roles.find(r => r.key === row.role && r.status === 'enabled')
    if (!role) return fail('角色不存在或已停用', 401)
    return { id: row.id, username, name: row.name, role: role.key, roleName: role.name, avatar: row.name[0] || 'N', permissions: role.key === 'super_admin' ? allPermissions : role.permissions }
  }
  const allowedMenus = (user: SessionUser) => menus.filter(m => m.status === 'enabled' && user.permissions.includes(m.permission)).sort((a,b) => a.sort-b.sort)
  if (config.url === '/auth/login') {
    if (!credentials[body.username] || credentials[body.username].password !== body.password) fail('账号或密码错误', 401)
    const user = current(body.username)
    const token = crypto.randomUUID(); sessions[token] = user.username; save('nova-sessions', sessions)
    return respond({ token, user, menus: allowedMenus(user) })
  }
  const token = String(config.headers.Authorization || '').replace('Bearer ', '')
  if (!sessions[token]) fail('登录已过期，请重新登录', 401)
  const user = current(sessions[token])
  if (config.url === '/auth/me') return respond({ user, menus: allowedMenus(user) })
  if (config.url === '/auth/logout') { delete sessions[token]; save('nova-sessions', sessions); return respond({ success: true }) }
  const resource = config.url?.slice(1)
  if (!['users','roles','menus'].includes(resource || '')) return fail('接口不存在',404)
  const kind = resource === 'users' ? 'user' : resource === 'roles' ? 'role' : 'menu'
  const list = resource === 'users' ? users : resource === 'roles' ? roles : menus
  const action = config.method === 'get' ? 'view' : config.method === 'delete' ? 'delete' : body?.id ? 'edit' : 'create'
  if (!user.permissions.includes(`${kind}:${action}` as never)) fail('无权执行此操作',403)
  if (config.method === 'get') {
    if (resource === 'roles') return respond(roles.map(r => ({ ...r, memberCount: users.filter(u => u.role === r.key).length })))
    return respond(resource === 'users' && !user.permissions.includes('user:phone') ? users.map(u => ({ ...u, phone: '' })) : list)
  }
  if (config.method === 'delete') {
    const ids: number[] = body.ids
    if (!Array.isArray(ids) || !ids.length) fail('请选择删除记录')
    if (resource === 'users' && users.some(u => ids.includes(u.id) && (u.username === user.username || u.role === 'super_admin'))) fail('不能删除当前账号或超级管理员')
    if (resource === 'roles' && roles.some(r => ids.includes(r.id) && (r.key === 'super_admin' || users.some(u => u.role === r.key)))) fail('角色仍有用户使用或为内置管理员角色')
    if (resource === 'menus' && ids.includes(4)) fail('菜单管理入口不可删除')
    if (resource === 'users') { users.filter(u => ids.includes(u.id)).forEach(u => delete credentials[u.username]); save('nova-accounts',credentials) }
    save(`nova-${resource}`, list.filter(item => !ids.includes(item.id)))
  } else if (config.method === 'post') {
    const index = list.findIndex(item => item.id === body.id)
    if (body.id && index < 0) fail('记录不存在',404)
    if (resource === 'users') {
      if (!body.name?.trim() || !/^[a-zA-Z0-9_]{3,30}$/.test(body.username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) fail('姓名、账号或邮箱格式不正确')
      if (users.some(u => u.username === body.username && u.id !== body.id)) fail('登录账号已存在')
      if (index >= 0 && users[index].username !== body.username) fail('登录账号不可修改')
      if (!roles.some(r => r.key === body.role && r.status === 'enabled')) fail('请选择启用的角色')
      if (index >= 0 && users[index].role === 'super_admin' && (body.role !== 'super_admin' || body.status !== 'enabled')) fail('内置管理员不可停用或变更角色')
      if (index < 0 && (!body.password || body.password.length < 6)) fail('新账号密码至少 6 位')
      if (body.password) credentials[body.username] = { password: body.password, user: {} as SessionUser }
      save('nova-accounts', credentials)
      delete body.password
    }
    if (resource === 'roles') {
      if (!body.name?.trim() || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(body.key)) fail('请填写角色名称及合法标识')
      if (roles.some(r => r.key === body.key && r.id !== body.id)) fail('角色标识已存在')
      if (index >= 0 && roles[index].key !== body.key) fail('角色标识不可修改')
      if (body.key === 'super_admin') { body.permissions = allPermissions; body.status = 'enabled' }
      if (!Array.isArray(body.permissions) || body.permissions.some((p: string) => !allPermissions.includes(p as never))) fail('无效权限码')
    }
    if (resource === 'menus') {
      if (!body.label?.trim() || !/^\/[a-z][a-z0-9/-]*$/.test(body.path) || ['/login','/403'].includes(body.path)) fail('菜单名称或路径无效')
      const permission = ({ dashboard:'dashboard:view', users:'user:view', roles:'role:view', menus:'menu:view' } as Record<string,string>)[body.component]
      if (!permission || permission !== body.permission) fail('组件与页面权限不匹配')
      if (menus.some(m => m.path === body.path && m.id !== body.id)) fail('路由路径已存在')
      if (body.id === 4 && (body.path !== '/menus' || body.status !== 'enabled' || body.component !== 'menus')) fail('菜单管理入口必须保留')
    }
    const row = { ...body, id: body.id || Date.now() }
    index < 0 ? list.push(row) : list.splice(index,1,row)
    save(`nova-${resource}`, list)
  } else return fail('不支持的请求方法',405)
  return respond({ success: true })
}
