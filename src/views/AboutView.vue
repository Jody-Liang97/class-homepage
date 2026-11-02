<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PageIntro from '../components/PageIntro.vue'
import aboutDataRaw from '../content/about.json'
import albumsData from '../content/albums.json'
import resourcesData from '../content/resources.json'
import siteData from '../content/site.json'
import type { AboutContent, Album, Resource, SiteContent } from '../types/content'
import { getRoundedDownDaysSince, resolveUrl } from '../utils/content'
import { getPinnedPageOffset, getPinnedScrollProgress } from '../utils/scroll'

type GalleryScrollBehavior = 'auto' | 'smooth'

const about = aboutDataRaw as AboutContent
const site = siteData as SiteContent
const resources = resourcesData as Resource[]
const albums = albumsData as Album[]

const metricsRef = ref<HTMLElement | null>(null)
const journeyRef = ref<HTMLElement | null>(null)
const filmStoryRef = ref<HTMLElement | null>(null)
const galleryTrackRef = ref<HTMLElement | null>(null)
const activeChapterIndex = ref(0)
const openWishes = ref<string[]>([])
const metricsVisible = ref(false)
const filmStoryEnabled = ref(false)
const filmScrollSpan = ref(0)
const filmProgress = ref(0)

const metricItems = computed(() => [
  {
    id: 'days',
    value: `${getRoundedDownDaysSince(about.metrics.classStartedAt)}+`,
    label: '天朝夕相伴',
    caption: `从 ${about.metrics.classStartedAt.replaceAll('-', '.')} 开始自动计日`,
    symbol: '◷',
    tone: 'violet',
  },
  {
    id: 'notes',
    value: String(resources.length),
    label: '份共享笔记',
    caption: '随学习资料库自动更新',
    symbol: '⌁',
    tone: 'mint',
  },
  {
    id: 'albums',
    value: String(albums.length),
    label: '组活动相册',
    caption: '随班级回忆录自动更新',
    symbol: '▣',
    tone: 'orange',
  },
  {
    id: 'hearts',
    value: String(about.metrics.hearts),
    label: '颗同行赤子之心',
    caption: '各自闪光，也彼此照亮',
    symbol: '♥',
    tone: 'rose',
  },
])

const filmStoryStyle = computed(() => ({
  '--film-scroll-span': `${filmScrollSpan.value}px`,
  '--film-progress': String(filmProgress.value),
}))

const filmProgressIndex = computed(() => {
  const lastIndex = Math.max(0, about.gallery.length - 1)
  return String(Math.round(filmProgress.value * lastIndex) + 1).padStart(2, '0')
})

function toggleWish(id: string) {
  openWishes.value = openWishes.value.includes(id)
    ? openWishes.value.filter((wishId) => wishId !== id)
    : [...openWishes.value, id]
}

function syncPageToGallery(scrollLeft: number, behavior: GalleryScrollBehavior) {
  const story = filmStoryRef.value
  const track = galleryTrackRef.value
  if (!story || !track || !filmStoryEnabled.value || filmMaxScroll <= 0) return

  const sectionDocumentTop = window.scrollY + story.getBoundingClientRect().top
  const top = getPinnedPageOffset(
    sectionDocumentTop,
    filmScrollSpan.value,
    scrollLeft,
    filmMaxScroll,
  )
  window.scrollTo({ top, behavior })
}

function scrollGallery(direction: -1 | 1) {
  const track = galleryTrackRef.value
  if (!track) return
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior: GalleryScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth'
  const delta = Math.max(280, track.clientWidth * 0.72)
  const targetLeft = Math.min(filmMaxScroll, Math.max(0, track.scrollLeft + direction * delta))

  if (filmStoryEnabled.value) {
    syncPageToGallery(targetLeft, behavior)
    return
  }

  track.scrollTo({ left: targetLeft, behavior })
}

function handleGalleryKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  scrollGallery(event.key === 'ArrowLeft' ? -1 : 1)
}

let isDraggingGallery = false
let galleryDragMoved = false
let galleryDragStartX = 0
let galleryDragStartScroll = 0

function startGalleryDrag(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  const track = galleryTrackRef.value
  if (!track) return
  isDraggingGallery = true
  galleryDragMoved = false
  galleryDragStartX = event.clientX
  galleryDragStartScroll = track.scrollLeft
  track.classList.add('is-dragging')
  track.setPointerCapture(event.pointerId)
}

function moveGalleryDrag(event: PointerEvent) {
  if (!isDraggingGallery) return
  const track = galleryTrackRef.value
  if (!track) return
  const distance = event.clientX - galleryDragStartX
  if (Math.abs(distance) > 5) galleryDragMoved = true
  track.scrollLeft = galleryDragStartScroll - distance
  filmProgress.value = filmMaxScroll > 0 ? Math.min(1, Math.max(0, track.scrollLeft / filmMaxScroll)) : 0
}

function endGalleryDrag(event: PointerEvent) {
  const track = galleryTrackRef.value
  if (!track || !isDraggingGallery) return
  isDraggingGallery = false
  track.classList.remove('is-dragging')
  if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId)
  if (filmStoryEnabled.value) syncPageToGallery(track.scrollLeft, 'auto')
}

function handleGalleryClick(event: MouseEvent) {
  if (!galleryDragMoved) return
  event.preventDefault()
  galleryDragMoved = false
}

function handleGalleryScroll() {
  const track = galleryTrackRef.value
  if (!track || (filmStoryEnabled.value && !isDraggingGallery)) return
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
  filmProgress.value = maxScroll > 0 ? Math.min(1, Math.max(0, track.scrollLeft / maxScroll)) : 0
}

let scrollFrame: number | null = null
let filmMaxScroll = 0
let chapterObserver: IntersectionObserver | null = null
let metricsObserver: IntersectionObserver | null = null
let filmResizeObserver: ResizeObserver | null = null
let motionPreference: MediaQueryList | null = null
let filmDesktopPreference: MediaQueryList | null = null

function updateFilmStory() {
  const story = filmStoryRef.value
  const track = galleryTrackRef.value
  if (!story || !track || !filmStoryEnabled.value || isDraggingGallery) return

  const progress = getPinnedScrollProgress(story.getBoundingClientRect().top, filmScrollSpan.value)
  const targetLeft = progress * filmMaxScroll
  filmProgress.value = progress
  if (Math.abs(track.scrollLeft - targetLeft) > 0.5) track.scrollLeft = targetLeft
}

function updateScrollEffects() {
  scrollFrame = null
  updateFilmStory()
}

function scheduleScrollEffects() {
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateScrollEffects)
}

function updateFilmMeasurements() {
  const track = galleryTrackRef.value
  if (!track) return

  filmMaxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
  filmScrollSpan.value = filmMaxScroll > 0
    ? Math.round(Math.max(filmMaxScroll * 1.1, window.innerHeight * 0.75))
    : 0
  filmStoryEnabled.value = Boolean(
    window.innerWidth > 860
    && filmDesktopPreference?.matches
    && !motionPreference?.matches
    && filmMaxScroll > 8,
  )

  if (!filmStoryEnabled.value) {
    filmProgress.value = filmMaxScroll > 0
      ? Math.min(1, Math.max(0, track.scrollLeft / filmMaxScroll))
      : 0
  }
  scheduleScrollEffects()
}

function handleViewportChange() {
  updateFilmMeasurements()
  scheduleScrollEffects()
}

function setupChapterObserver() {
  chapterObserver?.disconnect()
  const journey = journeyRef.value
  if (!journey || !('IntersectionObserver' in window)) return

  const chapterElements = journey.querySelectorAll<HTMLElement>('[data-chapter-index]')
  chapterObserver = new IntersectionObserver((entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
    if (!visibleEntries.length) return
    const index = Number((visibleEntries[0].target as HTMLElement).dataset.chapterIndex)
    if (Number.isFinite(index)) activeChapterIndex.value = index
  }, { threshold: [0.2, 0.45, 0.7], rootMargin: '-28% 0px -36% 0px' })

  chapterElements.forEach((element) => chapterObserver?.observe(element))
}

function setupMetricsObserver() {
  metricsObserver?.disconnect()
  const metrics = metricsRef.value
  if (!metrics) return

  if (motionPreference?.matches || !('IntersectionObserver' in window)) {
    metricsVisible.value = true
    return
  }

  metricsObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return
    metricsVisible.value = true
    metricsObserver?.disconnect()
  }, { threshold: 0.2 })
  metricsObserver.observe(metrics)
}

async function handleMotionPreferenceChange() {
  await nextTick()
  if (motionPreference?.matches) metricsVisible.value = true
  updateFilmMeasurements()
  scheduleScrollEffects()
}

onMounted(async () => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  filmDesktopPreference = window.matchMedia('(pointer: fine)')
  motionPreference.addEventListener('change', handleMotionPreferenceChange)
  filmDesktopPreference.addEventListener('change', handleViewportChange)
  window.addEventListener('scroll', scheduleScrollEffects, { passive: true })
  window.addEventListener('resize', handleViewportChange)
  setupChapterObserver()
  setupMetricsObserver()
  await nextTick()
  filmResizeObserver = new ResizeObserver(() => updateFilmMeasurements())
  if (galleryTrackRef.value) filmResizeObserver.observe(galleryTrackRef.value)
  updateFilmMeasurements()
  scheduleScrollEffects()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleScrollEffects)
  window.removeEventListener('resize', handleViewportChange)
  motionPreference?.removeEventListener('change', handleMotionPreferenceChange)
  filmDesktopPreference?.removeEventListener('change', handleViewportChange)
  chapterObserver?.disconnect()
  metricsObserver?.disconnect()
  filmResizeObserver?.disconnect()
  if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <div class="about-page">
    <PageIntro
      eyebrow="ABOUT OUR CLASS"
      :title="about.hero.title"
      :accent="about.hero.accent"
      :description="about.hero.lead"
    />

    <section
      ref="metricsRef"
      class="about-metrics-transition"
      :class="{ 'is-visible': metricsVisible }"
      aria-labelledby="about-metrics-title"
    >
      <div class="container about-metrics-inner">
        <div class="about-metrics-copy">
          <span class="eyebrow"><i></i>CLASS WARMTH</span>
          <h2 id="about-metrics-title">这一段同行，<br>正被日子慢慢写长。</h2>
          <p>有些温度藏在普通日常里，也可以被时间、分享与共同珍藏的片刻轻轻记下。</p>
        </div>
        <div class="about-metric-grid" aria-label="班级温情指标">
          <article
            v-for="item in metricItems"
            :key="item.id"
            class="about-metric-card"
            :class="`metric-${item.tone}`"
          >
            <span class="about-metric-symbol" aria-hidden="true">{{ item.symbol }}</span>
            <strong>{{ item.value }}</strong>
            <span class="about-metric-label">{{ item.label }}</span>
            <small>{{ item.caption }}</small>
          </article>
        </div>
      </div>
    </section>

    <section id="our-journey" ref="journeyRef" class="about-journey-section">
      <div class="container about-section-intro reveal">
        <span class="eyebrow"><i></i>HOW WE BECOME US</span>
        <h2>成为“我们”，<br>不需要一个盛大的瞬间。</h2>
        <p>更像许多微小的靠近，在同一段日子里慢慢有了形状。</p>
      </div>

      <div class="container about-journey-layout">
        <div class="about-chapter-list">
          <article
            v-for="(chapter, index) in about.chapters"
            :key="chapter.id"
            class="about-chapter-copy"
            :class="{ 'is-active': activeChapterIndex === index }"
            :data-chapter-index="index"
          >
            <div class="about-chapter-number">{{ chapter.number }}</div>
            <div>
              <span class="about-chapter-kicker">{{ chapter.kicker }}</span>
              <h3>{{ chapter.title }}</h3>
              <p class="about-chapter-summary">{{ chapter.summary }}</p>
              <p class="about-chapter-detail">{{ chapter.detail }}</p>
            </div>
          </article>
        </div>

        <aside class="about-journey-visual" aria-live="polite">
          <div class="journey-constellation" :data-stage="activeChapterIndex">
            <div class="journey-warmth journey-warmth-one" aria-hidden="true"></div>
            <div class="journey-warmth journey-warmth-two" aria-hidden="true"></div>
            <div class="journey-lines" aria-hidden="true">
              <i v-for="chapter in about.chapters" :key="chapter.id"></i>
            </div>
            <span
              v-for="(chapter, index) in about.chapters"
              :key="chapter.id"
              class="journey-node"
              :class="{ 'is-reached': index <= activeChapterIndex, 'is-current': index === activeChapterIndex }"
            >
              <b>{{ chapter.number }}</b>
              <small>{{ chapter.title }}</small>
            </span>
            <div class="journey-center">
              <small>{{ about.chapters[activeChapterIndex]?.kicker }}</small>
              <strong>{{ about.chapters[activeChapterIndex]?.title }}</strong>
              <span>拾光 · 计科三班</span>
            </div>
          </div>
          <p class="journey-visual-caption">
            <span>SCROLL TO GATHER</span>
            <i></i>
            <span>{{ about.chapters[activeChapterIndex]?.number }} / 04</span>
          </p>
        </aside>
      </div>
    </section>

    <div class="about-dawn-transition" aria-hidden="true">
      <i class="dawn-orbit dawn-orbit-one"></i>
      <i class="dawn-orbit dawn-orbit-two"></i>
    </div>

    <section
      ref="filmStoryRef"
      class="about-film-story"
      :class="{ 'is-scroll-story': filmStoryEnabled }"
      :style="filmStoryStyle"
      aria-labelledby="about-film-title"
    >
      <div class="about-film-sticky">
        <div class="about-film-section">
          <div class="container about-section-heading">
            <div>
              <span class="eyebrow"><i></i>REAL MOMENTS</span>
              <h2 id="about-film-title">一些真实的同框，<br>已经足够说明温度。</h2>
            </div>
            <div class="about-film-controls" aria-label="照片胶片控制">
              <button type="button" aria-label="查看上一组照片" @click="scrollGallery(-1)">←</button>
              <button type="button" aria-label="查看下一组照片" @click="scrollGallery(1)">→</button>
            </div>
          </div>

          <div
            ref="galleryTrackRef"
            class="about-film-track"
            role="region"
            aria-label="班级照片胶片，可横向滑动"
            tabindex="0"
            @scroll="handleGalleryScroll"
            @keydown="handleGalleryKeydown"
            @pointerdown="startGalleryDrag"
            @pointermove="moveGalleryDrag"
            @pointerup="endGalleryDrag"
            @pointercancel="endGalleryDrag"
            @click="handleGalleryClick"
          >
            <RouterLink
              v-for="(photo, index) in about.gallery"
              :key="photo.id"
              class="about-film-card"
              :class="`about-film-card-${index + 1}`"
              to="/memories"
              draggable="false"
            >
              <span class="about-film-index">0{{ index + 1 }}</span>
              <div class="about-film-image">
                <img
                  :src="resolveUrl(photo.src)"
                  :alt="photo.alt"
                  :style="{ objectPosition: photo.objectPosition }"
                  loading="lazy"
                  draggable="false"
                >
              </div>
              <div class="about-film-caption">
                <strong>{{ photo.label }}</strong>
                <span>翻阅班级回忆 ↗</span>
              </div>
            </RouterLink>
          </div>

          <div class="container about-film-progress" aria-hidden="true">
            <span>{{ filmStoryEnabled ? 'SCROLL TO REVEAL' : 'DRAG TO EXPLORE' }}</span>
            <i><b></b></i>
            <span>{{ filmProgressIndex }} / {{ String(about.gallery.length).padStart(2, '0') }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="about-wishes-section container">
      <div class="about-wishes-heading reveal">
        <span class="eyebrow"><i></i>TO OUR FUTURE</span>
        <h2>写给未来的我们</h2>
        <p>不是谁的个人留言，只是我们愿意一起珍惜的方向。轻点卡片，读完这份愿望。</p>
      </div>

      <div class="about-wish-grid">
        <button
          v-for="wish in about.wishes"
          :key="wish.id"
          type="button"
          class="about-wish-card"
          :class="[`wish-${wish.tone}`, { 'is-open': openWishes.includes(wish.id) }]"
          :aria-expanded="openWishes.includes(wish.id)"
          @click="toggleWish(wish.id)"
        >
          <span class="about-wish-inner">
            <span class="about-wish-face about-wish-front">
              <small>{{ wish.number }}</small>
              <strong>{{ wish.title }}</strong>
              <i aria-hidden="true">＋</i>
            </span>
            <span class="about-wish-face about-wish-back">
              <small>{{ wish.number }}</small>
              <strong>{{ wish.body }}</strong>
              <i aria-hidden="true">←</i>
            </span>
          </span>
        </button>
      </div>
    </section>

    <section class="about-site-note container">
      <details class="about-site-note-card">
        <summary>
          <span class="about-site-note-mark">S</span>
          <span>
            <small>{{ about.siteNote.eyebrow }}</small>
            <strong>{{ about.siteNote.title }}</strong>
          </span>
          <i aria-hidden="true">＋</i>
        </summary>
        <div class="about-site-note-body">
          <p>{{ about.siteNote.summary }}</p>
          <dl>
            <div v-for="item in about.siteNote.items" :key="item.title">
              <dt>{{ item.title }}</dt>
              <dd>{{ item.text }}</dd>
            </div>
            <div>
              <dt>联系与维护</dt>
              <dd>
                {{ site.maintainerName }}（{{ site.maintainerRole }}）负责维护；可通过{{ site.contact }}或邮箱
                <a :href="`mailto:${site.contactEmail}`">{{ site.contactEmail }}</a>
                联系。
              </dd>
            </div>
          </dl>
        </div>
      </details>
    </section>
  </div>
</template>
