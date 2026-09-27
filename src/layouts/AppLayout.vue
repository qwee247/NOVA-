<script setup lang="ts">
import { computed, ref, type Component, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataAnalysis, Fold, User, Key, Bell, ArrowDown, Expand } from '@element-plus/icons-vue'
import type { PermissionKey } from '../types'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

interface MenuItem {
  path: string
  label: string
  icon: Component
  permission: PermissionKey
}

const auth = useAuthStore()
const data = useDataStore()
const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '数据概览', icon: DataAnalysis, permission: 'dashboard:view' },
  { path: '/users', label: '用户管理', icon: User, permission: 'user:view' },
  { path: '/roles', label: '角色管理', icon: Key, permission: 'role:view' },
  { path: '/menus', label: '菜单管理', icon: Key, permission: 'menu:view' },
]
const menus = computed(() => menuItems.filter((item) => auth.can(item.permission)))
const logout = () => {
  auth.logout()
  router.replace('/login')
}
onMounted(() => data.load())
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="brand">
        <span class="brand-mark">N</span>
        <div v-if="!collapsed"><strong>NOVA</strong><small>ADMIN CONSOLE</small></div>
      </div>
      <div class="menu-caption" v-if="!collapsed">工作台</div>
      <nav>
        <router-link v-for="item in menus" :key="item.path" :to="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-foot" v-if="!collapsed">
        <span class="status-dot"></span>
        <div><strong>系统运行正常</strong><small>Mock Service · v1.0.0</small></div>
      </div>
    </aside>
    <section class="main-area">
      <header class="topbar">
        <button class="icon-button" @click="collapsed = !collapsed">
          <el-icon><component :is="collapsed ? Expand : Fold" /></el-icon>
        </button>
        <div class="breadcrumb"><span>权限中心</span><b>/</b><strong>{{ route.meta.title }}</strong></div>
        <div class="top-actions">
          <button class="icon-button notice"><el-icon><Bell /></el-icon><i></i></button>
          <div class="divider"></div>
          <el-dropdown trigger="click">
            <div class="profile">
              <span class="avatar">{{ auth.user?.avatar }}</span>
              <div><strong>{{ auth.user?.name }}</strong><small>{{ auth.user?.roleName }}</small></div>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu><el-dropdown-item @click="logout">退出登录</el-dropdown-item></el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="page-content"><router-view /></main>
    </section>
  </div>
</template>
