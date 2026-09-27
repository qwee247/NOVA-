import type { App, Directive } from 'vue'
import type { PermissionKey } from '../types'
import { useAuthStore } from '../stores/auth'

const permission: Directive<HTMLElement, PermissionKey> = {
  mounted(el, binding) {
    if (!useAuthStore().can(binding.value)) el.remove()
  },
}

export const setupPermission = (app: App) => app.directive('permission', permission)
