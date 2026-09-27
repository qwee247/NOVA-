import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { PermissionKey } from '../types'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import AppLayout from '../layouts/AppLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import RolesView from '../views/RolesView.vue'
import MenusView from '../views/MenusView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'

/** 扩展 vue-router 的路由 meta 类型 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    permission?: PermissionKey
    public?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/login', component: LoginView, meta: { public: true } },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: DashboardView, meta: { title: '数据概览', permission: 'dashboard:view' } },
      { path: 'users', component: UsersView, meta: { title: '用户管理', permission: 'user:view' } },
      { path: 'roles', component: RolesView, meta: { title: '角色管理', permission: 'role:view' } },
      { path: 'menus', component: MenusView, meta: { title: '菜单管理', permission: 'menu:view' } },
      { path: '403', component: ForbiddenView, meta: { title: '无权访问' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.isLoggedIn && !auth.ready) { try { await auth.refresh() } catch { auth.logout() } }
  if (to.meta.public) return auth.isLoggedIn ? '/dashboard' : true
  if (!auth.isLoggedIn) return `/login?redirect=${encodeURIComponent(to.fullPath)}`
  const permission = to.meta.permission
  if (permission && !auth.can(permission)) return '/403'
  return true
})

export default router
