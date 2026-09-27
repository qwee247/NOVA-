import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '../api/http'
import { useAuthStore } from './auth'
import type { MenuRow, RoleRow, UserRow } from '../types'
export const useDataStore = defineStore('data', () => {
  const users = ref<UserRow[]>([]), roles = ref<RoleRow[]>([]), menus = ref<MenuRow[]>([])
  const load = async () => {
    const auth = useAuthStore()
    users.value = []; roles.value = []; menus.value = []
    await Promise.all([
      auth.can('user:view') ? http.get<UserRow[]>('/users').then(r => { users.value = r.data }) : undefined,
      auth.can('role:view') ? http.get<RoleRow[]>('/roles').then(r => { roles.value = r.data }) : undefined,
      auth.can('menu:view') ? http.get<MenuRow[]>('/menus').then(r => { menus.value = r.data }) : undefined,
    ])
  }
  const mutate = async (path: string, body: unknown, remove = false) => {
    await http.request({ url: path, method: remove ? 'delete' : 'post', data: body })
    await useAuthStore().refresh()
    await load()
  }
  return { users, roles, menus, load,
    saveUser: (row: UserRow) => mutate('/users', row), removeUsers: (ids: number[]) => mutate('/users', { ids }, true),
    saveRole: (row: RoleRow) => mutate('/roles',row), removeRole: (id: number) => mutate('/roles',{ ids: [id] },true),
    saveMenu: (row: MenuRow) => mutate('/menus',row), removeMenu: (id: number) => mutate('/menus',{ ids: [id] },true),
  }
})
