<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Download, Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import type { UserRow, UserStatus } from '../types'
import { useDataStore } from '../stores/data'
import { useAuthStore } from '../stores/auth'

const data = useDataStore()
const auth = useAuthStore()
const query = reactive({ keyword: '', role: '', status: '' })
const page = ref(1)
const pageSize = ref(5)
const selected = ref<UserRow[]>([])
const dialog = ref(false)
const editing = ref(false)
const form = reactive({
  id: 0,
  name: '',
  username: '',
  password: '',
  phone: '',
  email: '',
  role: 'operator' as string,
  status: 'enabled' as UserStatus,
  department: '',
  createdAt: '',
})
const roleOptions = computed(() => data.roles)

const filtered = computed<UserRow[]>(() => data.users.filter((u) => {
  const text = `${u.name}${u.username}${u.email}${u.department}`.toLowerCase()
  return (!query.keyword || text.includes(query.keyword.toLowerCase())) && (!query.role || u.role === query.role) && (!query.status || u.status === query.status)
}))
const paged = computed<UserRow[]>(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const reset = () => { query.keyword = ''; query.role = ''; query.status = ''; page.value = 1 }
const openForm = (row?: UserRow) => {
  editing.value = Boolean(row)
  Object.assign(form, { ...row, password: '' })
  dialog.value = true
}
const submit = () => {
  if (!form.name || !form.username || !form.email) return ElMessage.warning('请完整填写必填信息')
  const role = data.roles.find((item) => item.key === form.role)
  if (!role) return ElMessage.warning('请先创建或选择一个角色')
  data.saveUser({ ...form })
  dialog.value = false
  ElMessage.success('用户信息已更新')
}
const remove = async (ids: number[]) => {
  await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 位用户吗？`, '删除确认', { type: 'warning' })
  const rows = data.users.filter((item) => ids.includes(item.id))
  auth.removeAccounts(rows.map((item) => item.username))
  data.removeUsers(ids)
  selected.value = []
  ElMessage.success('删除成功')
}
const exportExcel = () => {
  const rows = filtered.value.map((u) => ({ 姓名: u.name, 账号: u.username, 手机号: auth.can('user:phone') ? u.phone : '无权限查看', 邮箱: u.email, 部门: u.department, 角色: u.role === 'super_admin' ? '超级管理员' : '运营专员', 状态: u.status === 'enabled' ? '启用' : '禁用', 创建日期: u.createdAt }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, '用户数据')
  XLSX.writeFile(book, `NOVA用户数据-${new Date().toISOString().slice(0, 10)}.xlsx`)
  ElMessage.success('Excel 文件已导出')
}
const roleName = (role: string) => data.roles.find((item) => item.key === role)?.name || role
</script>

<template>
  <div class="page">
    <div class="page-heading compact"><div><p class="eyebrow dark">MEMBERS</p><h1>用户管理</h1><p>管理系统用户、角色归属与账号状态</p></div><div class="heading-actions"><el-button v-permission="'user:export'" :icon="Download" @click="exportExcel">导出 Excel</el-button><el-button v-permission="'user:create'" type="primary" @click="openForm()">新增用户</el-button></div></div>
    <article class="card table-card">
      <div class="filters">
        <el-input v-model="query.keyword" :prefix-icon="Search" clearable placeholder="搜索姓名、账号或部门" @keyup.enter="page = 1" />
        <el-select v-model="query.role" clearable placeholder="全部角色"><el-option v-for="role in roleOptions" :key="role.key" :label="role.name" :value="role.key" /></el-select>
        <el-select v-model="query.status" clearable placeholder="全部状态"><el-option label="已启用" value="enabled" /><el-option label="已禁用" value="disabled" /></el-select>
        <el-button :icon="Refresh" @click="reset">重置</el-button>
        <el-button v-if="selected.length && auth.can('user:delete')" type="danger" plain :icon="Delete" @click="remove(selected.map((x) => x.id))">批量删除 ({{ selected.length }})</el-button>
      </div>
      <el-table :data="paged" @selection-change="selected = $event" row-key="id">
        <el-table-column type="selection" width="48" />
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }"><div class="user-cell"><span>{{ row.name[0] }}</span><div><strong>{{ row.name }}</strong><small>@{{ row.username }}</small></div></div></template>
        </el-table-column>
        <el-table-column prop="department" label="部门" min-width="120" />
        <el-table-column label="联系方式" min-width="210">
          <template #default="{ row }"><div class="contact"><span>{{ row.email }}</span><small>{{ auth.can('user:phone') ? row.phone : '手机号受字段权限保护' }}</small></div></template>
        </el-table-column>
        <el-table-column label="角色" min-width="130"><template #default="{ row }"><span class="role-pill">{{ roleName(row.role) }}</span></template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{ row }"><span class="status-pill" :class="row.status">{{ row.status === 'enabled' ? '已启用' : '已禁用' }}</span></template></el-table-column>
        <el-table-column prop="createdAt" label="创建日期" width="120" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }"><el-button v-permission="'user:edit'" link type="primary" @click="openForm(row)">编辑</el-button><el-button v-permission="'user:delete'" link type="danger" @click="remove([row.id])">删除</el-button><span v-if="!auth.can('user:edit')" class="muted">仅查看</span></template>
        </el-table-column>
      </el-table>
      <div class="pagination"><span>共 {{ filtered.length }} 条记录</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="filtered.length" layout="prev, pager, next" /></div>
    </article>
    <el-dialog v-model="dialog" :title="editing ? '编辑用户' : '新增用户'" width="520px">
      <el-form label-position="top">
        <div class="form-grid"><el-form-item label="姓名 *"><el-input v-model="form.name" /></el-form-item><el-form-item label="登录账号 *"><el-input v-model="form.username" :disabled="editing" /></el-form-item></div>
        <el-form-item label="邮箱 *"><el-input v-model="form.email" /></el-form-item><el-form-item v-if="!editing" label="初始密码 *"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <div class="form-grid"><el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item><el-form-item label="所属部门"><el-input v-model="form.department" /></el-form-item></div>
        <div class="form-grid"><el-form-item label="角色"><el-select v-model="form.role"><el-option v-for="role in roleOptions" :key="role.key" :label="role.name" :value="role.key" /></el-select></el-form-item><el-form-item label="账号状态"><el-switch v-model="form.status" active-value="enabled" inactive-value="disabled" /></el-form-item></div>
      </el-form>
      <template #footer><el-button @click="dialog = false">取消</el-button><el-button type="primary" @click="submit">保存用户</el-button></template>
    </el-dialog>
  </div>
</template>
