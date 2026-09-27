<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '123456', remember: true })

const submit = async () => {
  if (!form.username || !form.password) return ElMessage.warning('请输入账号和密码')
  loading.value = true
  try {
    await auth.login(form.username, form.password, form.remember)
    ElMessage.success('登录成功，欢迎回来')
    const redirect = route.query.redirect
    const fallback = auth.can('dashboard:view') ? '/dashboard' : auth.can('user:view') ? '/users' : auth.can('role:view') ? '/roles' : '/403'
    const target = (typeof redirect === 'string' ? redirect : '') || fallback
    await router.replace(target)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

const useAccount = (username: string) => {
  form.username = username
  form.password = '123456'
}
</script>

<template>
  <div class="login-page">
    <section class="login-art">
      <div class="art-grid"></div>
      <div class="art-content">
        <div class="art-brand"><span class="brand-mark">N</span><strong>NOVA</strong></div>
        <p class="eyebrow">ENTERPRISE CONTROL CENTER</p>
        <h1>让权限管理<br /><em>清晰而可靠</em></h1>
        <p class="art-copy">以角色为核心，连接人员、权限与数据。<br />每一次访问，都恰到好处。</p>
        <div class="feature-row"><span>RBAC 权限模型</span><span>动态路由</span><span>操作审计</span></div>
      </div>
      <div class="art-orbit"><i></i><b></b><span></span></div>
    </section>
    <section class="login-panel">
      <div class="login-box">
        <p class="eyebrow dark">WELCOME BACK</p>
        <h2>登录管理后台</h2>
        <p class="subcopy">请输入您的工作账号以继续</p>
        <el-form @submit.prevent="submit">
          <label>账号</label>
          <el-input v-model="form.username" size="large" placeholder="请输入账号" :prefix-icon="User" />
          <label>密码</label>
          <el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" @keyup.enter="submit" />
          <div class="login-options"><el-checkbox v-model="form.remember">记住我</el-checkbox><a>忘记密码？</a></div>
          <el-button type="primary" size="large" :loading="loading" @click="submit">进入系统 <el-icon><ArrowRight /></el-icon></el-button>
        </el-form>
        <div class="demo-accounts">
          <span>体验账号</span>
          <button @click="useAccount('admin')">超级管理员</button>
          <button @click="useAccount('operator')">运营专员</button>
          <small>统一密码：123456</small>
        </div>
      </div>
      <footer>© 2026 NOVA Admin · Secure by design</footer>
    </section>
  </div>
</template>
