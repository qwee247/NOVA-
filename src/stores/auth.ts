import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { http } from '../api/http'
import type { AuthResult, MenuRow, PermissionKey, SessionUser } from '../types'
import type { Account } from '../types'
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('nova-token') || sessionStorage.getItem('nova-token') || '')
  const user = ref<SessionUser | null>(null)
  const menus = ref<MenuRow[]>([])
  const ready = ref(false)
  const isLoggedIn = computed(() => Boolean(token.value))
  const permissions = computed(() => user.value?.permissions || [])
  const apply = (result: Omit<AuthResult, 'token'>) => { user.value = result.user; menus.value = result.menus; ready.value = true }
  const login = async (username: string, password: string, remember = true) => {
    const { data } = await http.post<AuthResult>('/auth/login', { username, password })
    localStorage.removeItem('nova-token'); sessionStorage.removeItem('nova-token')
    token.value = data.token
    ;(remember ? localStorage : sessionStorage).setItem('nova-token',data.token)
    apply(data)
  }
  const refresh = async () => { const { data } = await http.get<Omit<AuthResult,'token'>>('/auth/me'); apply(data) }
  const logout = () => { token.value = ''; user.value = null; menus.value = []; ready.value = false; localStorage.removeItem('nova-token'); localStorage.removeItem('nova-user'); sessionStorage.removeItem('nova-token') }
  const can = (permission: PermissionKey) => permissions.value.includes(permission)
  const hasAccount = (username: string) => Boolean((JSON.parse(localStorage.getItem('nova-accounts') || '{}') as Record<string, Account>)[username])
  const registerAccount = (account: { password: string; user: Partial<SessionUser> }) => {
    const saved = JSON.parse(localStorage.getItem('nova-accounts') || '{}') as Record<string, Account>
    saved[account.user.username || ''] = { password: account.password, user: account.user as SessionUser }
    localStorage.setItem('nova-accounts', JSON.stringify(saved))
  }
  const removeAccounts = (usernames: string[]) => {
    const saved = JSON.parse(localStorage.getItem('nova-accounts') || '{}') as Record<string, Account>
    usernames.forEach(name => delete saved[name]); localStorage.setItem('nova-accounts', JSON.stringify(saved))
  }
  return { token, user, menus, permissions, ready, isLoggedIn, login, refresh, logout, can, hasAccount, registerAccount, removeAccounts }
})
