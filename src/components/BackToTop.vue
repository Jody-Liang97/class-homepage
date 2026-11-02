<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPageScrollState } from '../utils/scroll'

const route = useRoute()
const isVisible = ref(false)
const scrollProgress = ref(0)
const prefersReducedMotion = ref(false)

let animationFrame: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionPreference: MediaQueryList | null = null

const progressStyle = computed(() => ({
  '--scroll-progress': `${scrollProgress.value * 360}deg`,
}))

function updateScrollState() {
  const state = getPageScrollState(
    window.scrollY,
    document.documentElement.scrollHeight,
    window.innerHeight,
  )

  isVisible.value = state.isVisible
  scrollProgress.value = state.progress
}

function scheduleScrollUpdate() {
  if (animationFrame !== null) return

  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = null
    updateScrollState()
  })
}

function updateMotionPreference(event: MediaQueryListEvent) {
  prefersReducedMotion.value = event.matches
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth',
  })
}

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    scheduleScrollUpdate()
  },
)

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = motionPreference.matches
  motionPreference.addEventListener('change', updateMotionPreference)

  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true })
  window.addEventListener('resize', scheduleScrollUpdate, { passive: true })

  resizeObserver = new ResizeObserver(scheduleScrollUpdate)
  resizeObserver.observe(document.documentElement)

  scheduleScrollUpdate()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleScrollUpdate)
  window.removeEventListener('resize', scheduleScrollUpdate)
  motionPreference?.removeEventListener('change', updateMotionPreference)
  resizeObserver?.disconnect()

  if (animationFrame !== null) {
    window.cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <button
    class="back-to-top"
    :class="{ 'is-visible': isVisible }"
    :style="progressStyle"
    type="button"
    aria-label="回到顶部"
    :aria-hidden="isVisible ? undefined : 'true'"
    :tabindex="isVisible ? 0 : -1"
    @click="scrollToTop"
  >
    <span class="back-to-top__label" aria-hidden="true">回到顶部</span>
    <span class="back-to-top__surface" aria-hidden="true">
      <svg class="back-to-top__icon" viewBox="0 0 24 24" focusable="false">
        <path d="M12 19V5" />
        <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
      </svg>
    </span>
  </button>
</template>
