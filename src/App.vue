<script setup lang="ts">
import BackToTop from './components/BackToTop.vue'
import MainNav from './components/MainNav.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <div class="site-shell">
    <div class="ambient ambient-one" aria-hidden="true"></div>
    <div class="ambient ambient-two" aria-hidden="true"></div>
    <MainNav />
    <main id="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter />
    <BackToTop />
  </div>
</template>

