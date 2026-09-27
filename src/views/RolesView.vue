<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Plus, Key, UserFilled, EditPen, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { PermissionGroup, PermissionKey, RoleRow, UserRow, UserStatus } from '../types'
import { permissionLabels } from '../mock/data'
import { useDataStore } from '../stores/data'
import { useAuthStore } from '../stores/auth'

const data = useDataStore()
const auth = useAuthStore()
const dialog = ref(false)
const editing = ref(false)
const form = reactive({
  id: 0,
  name: '',
  key: 'operator',
  memberCount: 0,
  description: '',
  status: 'enabled' as UserStatus,
  permissions: [] as PermissionKey[],
  updatedAt: '',
})
const accountForm = reactive({ name: '', username: '', password: '', email: '', phone: '', department: '' })
const groups: PermissionGroup[] = [
  { name: '数据概览', keys: ['dashboard:view'] },
  { name: '用户管理', keys: ['user:view', 'user:create', 'user:edit', 'user:delete', 'user:export', 'user:phone'] },
  { name: '角色管理', keys: ['role:view', 'role:create', 'role:edit', 'role:delete'] },
]
const openForm = (row?: RoleRow) => {
  editing.value = Boolean(row)
  Object.assign(form, row ? { ...row, permissions: [...row.permissions] } : { id: 0, name: '', key: 'operator', memberCount: 0, description: '', status: 'enabled', permissions: ['dashboard:view'], updatedAt: '' })
  Object.assign(accountForm, { name: '', username: '', password: '', email: '', phone: '', department: '' })
  dialog.value = true
}
const submit = () => {
  if (!form.name) return ElMessage.warning('请输入角色名称')
  if (!form.key) return ElMessage.warning('请输入角色标识')
  if (!editing.value && data.roles.some((item) => item.key === form.key)) return ElMessage.warning('角色标识已存在')
  const shouldCreateAccount = !editing.value || accountForm.username || accountForm.password || accountForm.name || accountForm.email
  if (shouldCreateAccount && (!accountForm.name || !accountForm.username || !accountForm.password || !accountForm.email)) return ElMessage.warning('请完整填写登录账号、密码、姓名和邮箱')
  if (shouldCreateAccount && auth.hasAccount(accountForm.username)) return ElMessage.warning('登录账号已存在')
  const oldUser = data.users.find((item) => item.username === accountForm.username)
  const savedRole: RoleRow = { ...form, memberCount: editing.value ? form.memberCount + (shouldCreateAccount && !oldUser ? 1 : 0) : 1, permissions: [...form.permissions], updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) }
  data.saveRole(savedRole)
  if (shouldCreateAccount) {
    const userRow: UserRow = { id: oldUser?.id || Date.now(), name: accountForm.name, username: accountForm.username, password: accountForm.password, phone: accountForm.phone, email: accountForm.email, role: form.key, status: 'enabled', department: accountForm.department, createdAt: oldUser?.createdAt || new Date().toISOString().slice(0, 10) }
    data.saveUser(userRow)
    auth.registerAccount({ password: accountForm.password, user: { ...userRow, roleName: form.name, avatar: accountForm.name[0], permissions: [...form.permissions] } })
  }
  dialog.value = false
  ElMessage.success(editing.value ? '角色权限已更新' : '角色和登录账号创建成功')
}
const remove = async (row: RoleRow) => {
  await ElMessageBox.confirm(`确定删除角色“${row.name}”吗？`, '删除确认', { type: 'warning' })
  data.removeRole(row.id)
  ElMessage.success('角色已删除')
}
</script>

<template>
  <div class="page">
    <div class="page-heading compact"><div><p class="eyebrow dark">ACCESS CONTROL</p><h1>角色管理</h1><p>通过角色分配菜单、按钮与字段访问权限</p></div><el-button v-permission="'role:create'" type="primary" :icon="Plus" @click="openForm()">新增角色</el-button></div>
    <div class="role-summary">
      <article><span class="metric-icon blue"><el-icon><Key /></el-icon></span><div><p>角色总数</p><strong>{{ data.roles.length }}</strong></div></article>
      <article><span class="metric-icon green"><el-icon><UserFilled /></el-icon></span><div><p>已分配用户</p><strong>{{ data.roles.reduce((n, r) => n + r.memberCount, 0) }}</strong></div></article>
      <div class="permission-note"><b>三级权限体系</b><span>路由控制页面访问 · 按钮控制操作能力 · 字段控制敏感数据</span></div>
    </div>
    <div class="role-grid">
      <article v-for="role in data.roles" :key="role.id" class="card role-card">
        <div class="role-card-head"><span class="role-symbol"><el-icon><Key /></el-icon></span><div><h3>{{ role.name }}</h3><small>{{ role.key }}</small></div><span class="status-pill" :class="role.status">{{ role.status === 'enabled' ? '启用' : '停用' }}</span></div>
        <p class="role-desc">{{ role.description }}</p>
        <div class="role-meta"><span><el-icon><UserFilled /></el-icon>{{ role.memberCount }} 位成员</span><span>{{ role.permissions.length }} 项权限</span></div>
        <div class="permission-tags"><span v-for="p in role.permissions.slice(0, 5)" :key="p">{{ permissionLabels[p] }}</span><i v-if="role.permissions.length > 5">+{{ role.permissions.length - 5 }}</i></div>
        <div class="role-footer"><small>更新于 {{ role.updatedAt }}</small><div><el-button v-if="auth.can('role:edit')" :icon="EditPen" circle @click="openForm(role)" /><el-button v-if="auth.can('role:delete') && role.key !== 'super_admin'" :icon="Delete" circle @click="remove(role)" /></div></div>
      </article>
      <button v-if="auth.can('role:create')" class="new-role-card" @click="openForm()"><span>＋</span><strong>创建新角色</strong><small>配置一组新的访问权限</small></button>
    </div>
    <el-dialog v-model="dialog" :title="editing ? '编辑角色权限' : '创建新角色'" width="640px">
      <el-form label-position="top">
        <div class="form-grid"><el-form-item label="角色名称 *"><el-input v-model="form.name" placeholder="例如：内容审核员" /></el-form-item><el-form-item label="角色标识"><el-input v-model="form.key" :disabled="editing" /></el-form-item></div>
        <el-form-item label="角色说明"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-divider content-position="left">同时创建登录账号（编辑角色时可选）</el-divider>
        <div class="form-grid"><el-form-item label="姓名 *"><el-input v-model="accountForm.name" placeholder="登录后的用户姓名" /></el-form-item><el-form-item label="登录账号 *"><el-input v-model="accountForm.username" /></el-form-item></div>
        <div class="form-grid"><el-form-item label="登录密码 *"><el-input v-model="accountForm.password" type="password" show-password /></el-form-item><el-form-item label="邮箱 *"><el-input v-model="accountForm.email" /></el-form-item></div>
        <el-form-item label="权限配置">
          <div class="permission-tree"><div v-for="group in groups" :key="group.name"><strong>{{ group.name }}</strong><el-checkbox-group v-model="form.permissions"><el-checkbox v-for="key in group.keys" :key="key" :value="key">{{ permissionLabels[key] }}</el-checkbox></el-checkbox-group></div></div>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialog = false">取消</el-button><el-button type="primary" @click="submit">保存配置</el-button></template>
    </el-dialog>
  </div>
</template>
