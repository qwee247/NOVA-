<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { UserFilled, Key, DocumentChecked, TrendCharts, ArrowUp, MoreFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

interface Activity {
  name: string
  action: string
  time: string
  color: string
}

const auth = useAuthStore()
const data = useDataStore()
const activeUsers = computed(() => data.users.filter((u) => u.status === 'enabled').length)
const currentDate = ref('')
let dateTimer: number | undefined

const updateCurrentDate = () => {
  const now = new Date()
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now)
  currentDate.value = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${weekday}`
}

onMounted(() => {
  updateCurrentDate()
  dateTimer = window.setInterval(updateCurrentDate, 60_000)
})

onBeforeUnmount(() => {
  if (dateTimer) window.clearInterval(dateTimer)
})

const bars: number[] = [36, 48, 42, 61, 54, 72, 68, 82, 64, 77, 88, 76]
const activities: Activity[] = [
  { name: '陈屿', action: '更新了角色“运营专员”的权限', time: '12 分钟前', color: '#5468ff' },
  { name: '林晓', action: '导出了用户数据报表', time: '38 分钟前', color: '#20b486' },
  { name: '系统', action: '完成每日权限策略巡检', time: '1 小时前', color: '#f5a623' },
  { name: '周宁', action: '登录管理后台', time: '2 小时前', color: '#9b6cff' },
]
</script>

<template>
  <div class="page dashboard">
    <div class="page-heading">
      <div><p class="eyebrow dark">OVERVIEW</p><h1>早上好，{{ auth.user?.name }}</h1><p>这里是今天的系统运行概览。</p></div>
      <div class="date-chip">{{ currentDate }}</div>
    </div>
    <div class="metric-grid">
      <article><span class="metric-icon blue"><el-icon><UserFilled /></el-icon></span><div><p>用户总数</p><strong>{{ data.users.length }}</strong><small class="up"><el-icon><ArrowUp /></el-icon> 12.5% <i>较上月</i></small></div></article>
      <article><span class="metric-icon violet"><el-icon><Key /></el-icon></span><div><p>角色数量</p><strong>{{ data.roles.length }}</strong><small>权限分组稳定</small></div></article>
      <article><span class="metric-icon green"><el-icon><DocumentChecked /></el-icon></span><div><p>活跃用户</p><strong>{{ activeUsers }}</strong><small class="up"><el-icon><ArrowUp /></el-icon> 8.2% <i>较上周</i></small></div></article>
      <article><span class="metric-icon amber"><el-icon><TrendCharts /></el-icon></span><div><p>今日访问</p><strong>1,284</strong><small class="up"><el-icon><ArrowUp /></el-icon> 18.4% <i>较昨日</i></small></div></article>
    </div>
    <div class="dashboard-grid">
      <article class="card chart-card">
        <div class="card-head"><div><h3>访问趋势</h3><p>近 12 个月访问量</p></div><button class="plain-button">本年度⌄</button></div>
        <div class="chart">
          <div class="axis"><span>2K</span><span>1.5K</span><span>1K</span><span>500</span><span>0</span></div>
          <div class="bars"><div v-for="(bar, i) in bars" :key="i" class="bar-wrap"><i :style="{ height: bar + '%' }"></i><span>{{ i + 1 }}月</span></div></div>
        </div>
      </article>
      <article class="card activity-card">
        <div class="card-head"><div><h3>最近动态</h3><p>系统实时操作记录</p></div><el-icon><MoreFilled /></el-icon></div>
        <div class="activity-list">
          <div v-for="item in activities" :key="item.action">
            <span class="activity-avatar" :style="{ background: item.color }">{{ item.name[0] }}</span>
            <p><strong>{{ item.name }}</strong><span>{{ item.action }}</span><small>{{ item.time }}</small></p>
          </div>
        </div>
        <button class="view-all">查看全部动态 →</button>
      </article>
    </div>
    <article class="card permission-card">
      <div><span class="shield">✓</span><div><h3>权限策略运行正常</h3><p>当前共配置 {{ data.roles.length }} 个角色，所有权限节点状态正常，最近一次巡检于今天 08:00 完成。</p></div></div>
      <router-link to="/roles">查看权限配置 →</router-link>
    </article>
  </div>
</template>
