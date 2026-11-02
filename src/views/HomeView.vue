<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import HomeStoryShowcase from '../components/HomeStoryShowcase.vue'
import aboutData from '../content/about.json'
import siteData from '../content/site.json'
import resourcesData from '../content/resources.json'
import affairsData from '../content/affairs.json'
import albumsData from '../content/albums.json'
import type { AboutContent, Album, ClassAffair, Resource, SiteContent } from '../types/content'
import { getAffairStatus } from '../utils/content'

const site = siteData as SiteContent
const about = aboutData as AboutContent
const resources = resourcesData as Resource[]
const affairs = affairsData as ClassAffair[]
const albums = albumsData as Album[]
const recentResources = computed(() => {
  return [...resources]
    .sort((a, b) => {
      const diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (diff !== 0) return diff
      return a.title.localeCompare(b.title, 'zh-CN')
    })
    .slice(0, 3)
})
const currentAffairs = computed(() => affairs.filter((item) => getAffairStatus(item) !== 'ended').slice(0, 2))
const storyFlowRef = ref<HTMLElement | null>(null)
const activeStoryIndex = ref(0)
const isDesktopStory = ref(typeof window !== 'undefined' && window.matchMedia('(min-width: 1021px)').matches)

type StoryKind = 'resources' | 'affairs' | 'memories'

interface StoryItem {
  kind: StoryKind
  eyebrow: string
  title: string
  description: string
  route: string
  actionLabel: string
}

const storyItems: StoryItem[] = [
  {
    kind: 'resources',
    eyebrow: 'RECENTLY UPDATED',
    title: '最近整理的资料',
    description: '把近期整理的各学科重点、期末复习与期刊资料放在容易找到的地方。',
    route: '/resources',
    actionLabel: '查看全部资料',
  },
  {
    kind: 'affairs',
    eyebrow: 'COMING UP',
    title: '接下来，我们一起完成。',
    description: '把通知从聊天记录里解放出来。时间、地点和截止日期，一眼就能找到。',
    route: '/affairs',
    actionLabel: '进入事务板',
  },
  {
    kind: 'memories',
    eyebrow: 'CLASS MEMORIES',
    title: '日子会过去，故事不会。',
    description: '按时间收好每一次活动和相聚，让共同经历慢慢写成我们的故事。',
    route: '/memories',
    actionLabel: '进入回忆录',
  },
]

let animationFrame: number | null = null
let mobileRevealObserver: IntersectionObserver | null = null
let motionPreference: MediaQueryList | null = null
let layoutPreference: MediaQueryList | null = null

function updateActiveStory(flow: HTMLElement) {
  if (!isDesktopStory.value) return
  const items = Array.from(flow.querySelectorAll<HTMLElement>('.story-copy-item'))
  if (!items.length) return

  const triggerLine = window.innerHeight * 0.45
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY

  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect()
    const distance = Math.abs(rect.top + rect.height / 2 - triggerLine)
    if (distance >= nearestDistance) return
    nearestDistance = distance
    nearestIndex = index
  })

  if (activeStoryIndex.value !== nearestIndex) activeStoryIndex.value = nearestIndex
}

function applyScrollEffects() {
  animationFrame = null
  const flow = storyFlowRef.value
  if (!flow) return

  updateActiveStory(flow)

  if (motionPreference?.matches) {
    flow.style.setProperty('--flow-shift-violet', '0px')
    flow.style.setProperty('--flow-shift-mint', '0px')
    return
  }

  const rect = flow.getBoundingClientRect()
  if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return

  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)))
  const isMobile = window.innerWidth < 760
  const violetRange = isMobile ? 20 : 40
  const mintRange = isMobile ? 16 : 30

  flow.style.setProperty('--flow-shift-violet', `${(progress - 0.5) * violetRange}px`)
  flow.style.setProperty('--flow-shift-mint', `${(0.5 - progress) * mintRange}px`)
}

function scheduleScrollEffects() {
  if (animationFrame === null) animationFrame = window.requestAnimationFrame(applyScrollEffects)
}

function setupMobileRevealObserver() {
  const flow = storyFlowRef.value
  if (!flow) return

  mobileRevealObserver?.disconnect()
  flow.classList.remove('mobile-motion-ready')
  const revealItems = flow.querySelectorAll<HTMLElement>('.story-mobile-pair')

  if (isDesktopStory.value) return

  if (motionPreference?.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'))
    return
  }

  flow.classList.add('mobile-motion-ready')
  mobileRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const hasPassedViewport = entry.boundingClientRect.top < 0
      if (!entry.isIntersecting && !hasPassedViewport) return
      entry.target.classList.add('is-visible')
      mobileRevealObserver?.unobserve(entry.target)
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' })

  revealItems.forEach((item) => mobileRevealObserver?.observe(item))
}

async function handleMotionPreferenceChange() {
  await nextTick()
  setupMobileRevealObserver()
  scheduleScrollEffects()
}

async function handleLayoutPreferenceChange(event: MediaQueryListEvent) {
  isDesktopStory.value = event.matches
  activeStoryIndex.value = 0
  await nextTick()
  setupMobileRevealObserver()
  scheduleScrollEffects()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  layoutPreference = window.matchMedia('(min-width: 1021px)')
  isDesktopStory.value = layoutPreference.matches
  motionPreference.addEventListener('change', handleMotionPreferenceChange)
  layoutPreference.addEventListener('change', handleLayoutPreferenceChange)
  setupMobileRevealObserver()
  window.addEventListener('scroll', scheduleScrollEffects, { passive: true })
  window.addEventListener('resize', scheduleScrollEffects)
  scheduleScrollEffects()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleScrollEffects)
  window.removeEventListener('resize', scheduleScrollEffects)
  motionPreference?.removeEventListener('change', handleMotionPreferenceChange)
  layoutPreference?.removeEventListener('change', handleLayoutPreferenceChange)
  mobileRevealObserver?.disconnect()
  if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <div>
    <section class="hero container">
      <div class="hero-copy reveal">
        <div class="hero-note"><span>✦</span> {{ site.grade }} · {{ site.major }}</div>
        <h1>把每一次<br><em>学习与同行</em><br>都好好收藏。</h1>
        <p>{{ site.intro }}</p>
        <div class="hero-actions">
          <RouterLink class="button button-primary" to="/resources">浏览学习资料 <span>↗</span></RouterLink>
          <RouterLink class="button button-ghost" to="/affairs">查看近期事务 <span>→</span></RouterLink>
        </div>
      </div>
      <div class="hero-visual reveal delay-one" aria-label="班级主页功能概览">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="hero-core">
          <span class="core-label">OUR CLASS</span>
          <strong>拾光</strong>
          <small>LEARN · SHARE · REMEMBER</small>
        </div>
        <div class="float-card float-a"><i>⌁</i><span>学习资料<strong>{{ resources.length }} 份</strong></span></div>
        <div class="float-card float-b"><i>◫</i><span>近期事务<strong>{{ currentAffairs.length }} 项</strong></span></div>
        <div class="float-card float-c"><i>✦</i><span>班级相册<strong>{{ albums.length }} 册</strong></span></div>
      </div>
    </section>

    <section class="feature-strip container reveal" aria-label="网站核心功能">
      <RouterLink class="feature-card feature-blue" to="/resources">
        <span class="feature-index">01</span><i aria-hidden="true">⌁</i>
        <h2>学习资料</h2><p>各门专业课程复习与期刊资料，有序归档，随时取用。</p><b>开始查找 →</b>
      </RouterLink>
      <RouterLink class="feature-card feature-green" to="/affairs">
        <span class="feature-index">02</span><i aria-hidden="true">◷</i>
        <h2>班级事务</h2><p>重要节点清晰呈现，不错过每一次共同参与。</p><b>查看安排 →</b>
      </RouterLink>
      <RouterLink class="feature-card feature-orange" to="/memories">
        <span class="feature-index">03</span><i aria-hidden="true">✦</i>
        <h2>班级回忆</h2><p>把活动与合照按时间收好，慢慢写成我们的故事。</p><b>翻阅相册 →</b>
      </RouterLink>
    </section>

    <div ref="storyFlowRef" class="home-story-flow">
      <div class="flow-orb flow-orb-violet" aria-hidden="true"></div>
      <div class="flow-orb flow-orb-mint" aria-hidden="true"></div>

      <div v-if="isDesktopStory" class="story-desktop-layout container">
        <div class="story-copy-column">
          <article
            v-for="(item, index) in storyItems"
            :key="item.kind"
            class="story-copy-item"
            :class="{ 'is-active': activeStoryIndex === index, 'is-past': index < activeStoryIndex }"
            :aria-current="activeStoryIndex === index ? 'step' : undefined"
          >
            <span class="eyebrow"><i></i>{{ item.eyebrow }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
            <RouterLink class="text-link story-action" :to="item.route">{{ item.actionLabel }} <span>↗</span></RouterLink>
          </article>
        </div>
        <div class="story-showcase-rail">
          <div class="story-showcase-sticky">
            <div
              v-for="(item, index) in storyItems"
              :key="item.kind"
              class="story-panel"
              :class="{ 'is-active': activeStoryIndex === index, 'is-past': index < activeStoryIndex }"
              :aria-hidden="activeStoryIndex !== index"
              :inert="activeStoryIndex !== index"
            >
              <div class="story-panel-surface">
                <HomeStoryShowcase
                  :kind="item.kind"
                  :resources="recentResources"
                  :affairs="currentAffairs"
                  :albums="albums"
                  :slogan="site.slogan"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="story-mobile-list container">
        <article v-for="item in storyItems" :key="item.kind" class="story-mobile-pair">
          <div class="story-mobile-copy">
            <span class="eyebrow"><i></i>{{ item.eyebrow }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
            <RouterLink class="text-link story-action" :to="item.route">{{ item.actionLabel }} <span>↗</span></RouterLink>
          </div>
          <div class="story-panel-surface">
            <HomeStoryShowcase
              :kind="item.kind"
              :resources="recentResources"
              :affairs="currentAffairs"
              :albums="albums"
              :slogan="site.slogan"
            />
          </div>
        </article>
      </div>
    </div>

    <section class="section container maintainer-note reveal">
      <div class="note-mark">S</div>
      <div><span class="eyebrow"><i></i>{{ about.siteNote.eyebrow }}</span><h2>{{ about.siteNote.title }}</h2></div>
      <p>
        {{ about.siteNote.summary }}
        <span class="maintainer-credit">由{{ site.maintainerName }}（{{ site.maintainerRole }}）维护。页面内容在确认来源、版权与照片授权后发布，并持续整理更新。</span>
      </p>
      <RouterLink class="round-link" to="/about" aria-label="了解网站说明">↗</RouterLink>
    </section>
  </div>
</template>

