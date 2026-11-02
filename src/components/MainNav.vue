<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)
const links = [
  { to: '/', label: '首页' },
  { to: '/resources', label: '学习资料' },
  { to: '/affairs', label: '班级事务' },
  { to: '/memories', label: '班级回忆' },
  { to: '/about', label: '关于班级' },
]

watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <header class="nav-wrap">
    <nav class="main-nav container" aria-label="主要导航">
      <RouterLink class="brand" to="/" aria-label="拾光班级主页">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>拾光</span>
      </RouterLink>
      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="nav-links"
        :aria-label="menuOpen ? '关闭导航菜单' : '打开导航菜单'"
        @click="menuOpen = !menuOpen"
      >
        <span></span><span></span>
      </button>
      <div id="nav-links" class="nav-links" :class="{ open: menuOpen }">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">
          {{ link.label }}
        </RouterLink>
      </div>
      <RouterLink class="nav-cta" to="/resources">开始探索 <span aria-hidden="true">↗</span></RouterLink>
    </nav>
  </header>
</template>

