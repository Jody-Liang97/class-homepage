<script setup lang="ts">
import site from '../content/site.json'
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="footer-brand"><span class="brand-dot"></span>{{ site.shortName }}</div>
        <p>{{ site.slogan }}</p>
      </div>
      <div class="footer-links" aria-label="页脚导航">
        <RouterLink to="/resources">资料库</RouterLink>
        <RouterLink to="/affairs">事务板</RouterLink>
        <RouterLink to="/memories">回忆录</RouterLink>
        <RouterLink to="/about">关于我们</RouterLink>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© 2026 {{ site.shortName }}</span>
      <span>尊重隐私，也尊重每一份知识的来源。</span>
    </div>
  </footer>
</template>

