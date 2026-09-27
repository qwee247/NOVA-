<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Plus, EditPen, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStore } from '../stores/data'
import { useAuthStore } from '../stores/auth'
import type { MenuRow, PermissionKey, UserStatus } from '../types'
const data = useDataStore(); const auth = useAuthStore(); const dialog = ref(false); const editing = ref(false)
const form = reactive<MenuRow>({ id: 0, label: '', path: '/', component: 'dashboard', permission: 'dashboard:view', sort: 1, status: 'enabled' })
const components: Array<{ label: string; value: MenuRow['component']; permission: PermissionKey }> = [
  { label: '数据概览', value: 'dashboard', permission: 'dashboard:view' }, { label: '用户管理', value: 'users', permission: 'user:view' }, { label: '角色管理', value: 'roles', permission: 'role:view' }, { label: '菜单管理', value: 'menus', permission: 'menu:view' },
]
const openForm = (row?: MenuRow) => { editing.value = Boolean(row); Object.assign(form, row ? { ...row } : { id: 0, label: '', path: '/', component: 'dashboard', permission: 'dashboard:view', sort: data.menus.length + 1, status: 'enabled' }); dialog.value = true }
const submit = async () => { if (!form.label || !form.path) return ElMessage.warning('请填写菜单名称和路径'); await data.saveMenu({ ...form }); dialog.value = false; ElMessage.success('菜单配置已保存') }
const remove = async (row: MenuRow) => { await ElMessageBox.confirm(`确定删除菜单“${row.label}”吗？`, '删除确认', { type: 'warning' }); await data.removeMenu(row.id); ElMessage.success('菜单已删除') }
</script>
<template><div class="page"><div class="page-heading compact"><div><p class="eyebrow dark">MENU AUTHORIZATION</p><h1>菜单管理</h1><p>维护动态路由、菜单权限与展示顺序</p></div><el-button v-permission="'menu:create'" type="primary" :icon="Plus" @click="openForm()">新增菜单</el-button></div>
<article class="card table-card"><el-table :data="data.menus" row-key="id"><el-table-column prop="sort" label="排序" width="80" /><el-table-column prop="label" label="菜单名称" min-width="160" /><el-table-column prop="path" label="路由路径" min-width="180" /><el-table-column prop="permission" label="权限码" min-width="180" /><el-table-column label="状态" width="100"><template #default="{ row }"><span class="status-pill" :class="row.status">{{ row.status === 'enabled' ? '启用' : '停用' }}</span></template></el-table-column><el-table-column label="操作" width="150"><template #default="{ row }"><el-button v-permission="'menu:edit'" link type="primary" :icon="EditPen" @click="openForm(row)">编辑</el-button><el-button v-if="row.id !== 4" v-permission="'menu:delete'" link type="danger" :icon="Delete" @click="remove(row)">删除</el-button></template></el-table-column></el-table></article>
<el-dialog v-model="dialog" :title="editing ? '编辑菜单' : '新增菜单'" width="520px"><el-form label-position="top"><div class="form-grid"><el-form-item label="菜单名称"><el-input v-model="form.label" /></el-form-item><el-form-item label="路由路径"><el-input v-model="form.path" /></el-form-item></div><div class="form-grid"><el-form-item label="页面组件"><el-select v-model="form.component" @change="form.permission = components.find(x => x.value === form.component)!.permission"><el-option v-for="item in components" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item><el-form-item label="排序"><el-input-number v-model="form.sort" :min="1" /></el-form-item></div><el-form-item label="状态"><el-switch v-model="form.status" active-value="enabled" inactive-value="disabled" /></el-form-item></el-form><template #footer><el-button @click="dialog = false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template></el-dialog></div></template>
