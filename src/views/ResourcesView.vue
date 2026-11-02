<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import CourseCard from '../components/CourseCard.vue'
import PageIntro from '../components/PageIntro.vue'
import ResourceCard from '../components/ResourceCard.vue'
import coursesData from '../content/courses.json'
import resourcesData from '../content/resources.json'
import type { Course, Resource, ResourceCategory, ResourceFilters } from '../types/content'
import { categoryLabels, filterResources } from '../utils/content'

const resources = resourcesData as Resource[]
const courses = [...(coursesData as Course[])].sort((a, b) => a.order - b.order)
const filters = reactive<ResourceFilters>({ query: '', category: 'course', courseId: 'all', subject: 'all', fileType: 'all' })
const sortBy = ref<'updated' | 'name'>('updated')
const resultsSection = ref<HTMLElement | null>(null)
const resultsHeading = ref<HTMLElement | null>(null)

const categoryOptions: Array<[ResourceCategory | 'all', string]> = [
  ['course', '校内课程'],
  ['other', '其他资源'],
  ['all', '全部资料'],
]

const scopedResources = computed(() => resources.filter((resource) => {
  const categoryMatches = filters.category === 'all' || resource.category === filters.category
  const courseMatches = filters.courseId === 'all' || resource.courseId === filters.courseId
  return categoryMatches && courseMatches
}))

const subjects = computed(() => [...new Set(scopedResources.value.map((item) => item.subject))])
const fileTypes = computed(() => [...new Set(scopedResources.value.map((item) => item.fileType))])

const courseSummaries = computed(() => {
  const list = courses.map((course) => {
    const items = resources.filter((resource) => resource.category === 'course' && resource.courseId === course.id)
    const latestUpdatedAt = items.reduce<string | undefined>((latest, resource) => (
      !latest || Date.parse(resource.updatedAt) > Date.parse(latest) ? resource.updatedAt : latest
    ), undefined)
    return { course, resourceCount: items.length, latestUpdatedAt }
  })

  return list.sort((a, b) => {
    const timeA = a.latestUpdatedAt ? Date.parse(a.latestUpdatedAt) : 0
    const timeB = b.latestUpdatedAt ? Date.parse(b.latestUpdatedAt) : 0
    if (timeB !== timeA) {
      return timeB - timeA
    }
    return a.course.order - b.course.order
  })
})

const selectedCourse = computed(() => courses.find((course) => course.id === filters.courseId))

const results = computed(() => {
  const filtered = filterResources(resources, filters)
  return [...filtered].sort((a, b) => sortBy.value === 'name'
    ? a.title.localeCompare(b.title, 'zh-CN')
    : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

const resultTitle = computed(() => {
  if (selectedCourse.value) return `${selectedCourse.value.name}资料`
  if (filters.category === 'course') return '全部校内课程资料'
  if (filters.category === 'all') return '全部资料'
  return categoryLabels[filters.category]
})

function setCategory(category: ResourceCategory | 'all') {
  filters.category = category
  filters.courseId = 'all'
  filters.subject = 'all'
  filters.fileType = 'all'
  sortBy.value = 'updated'
}

async function selectCourse(courseId: string, resourceCount: number) {
  if (resourceCount === 0) return
  filters.category = 'course'
  filters.courseId = courseId
  filters.subject = 'all'
  filters.fileType = 'all'
  sortBy.value = 'updated'
  await nextTick()
  resultsHeading.value?.focus({ preventScroll: true })
  resultsSection.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

function showAllCourses() {
  filters.courseId = 'all'
  filters.subject = 'all'
  filters.fileType = 'all'
}

function resetFilters() {
  Object.assign(filters, { query: '', category: 'course', courseId: 'all', subject: 'all', fileType: 'all' })
  sortBy.value = 'updated'
}
</script>

<template>
  <div>
    <PageIntro eyebrow="RESOURCE LIBRARY" title="把好资料，放在" accent="找得到的地方。" description="校内课程优先整理，其他精选资料也可以按分类快速找到。支持一键直接下载。">
      <div class="intro-stats"><span><strong>{{ resources.length }}</strong> 份学习资料</span><span><strong>{{ courses.length }}</strong> 门校内课程</span></div>
    </PageIntro>

    <section class="container content-section resource-browser">
      <nav class="resource-category-nav" aria-label="资料一级分类">
        <button
          v-for="[value, label] in categoryOptions"
          :key="value"
          type="button"
          :class="{ active: filters.category === value }"
          :aria-pressed="filters.category === value"
          @click="setCategory(value)"
        >
          {{ label }}
        </button>
      </nav>

      <section v-if="filters.category === 'course'" class="course-directory" aria-labelledby="course-directory-title">
        <div class="resource-section-heading">
          <div>
            <span class="eyebrow"><i></i>CAMPUS COURSES</span>
            <h2 id="course-directory-title">先选择一门课程</h2>
            <p>课程卡会随着资料目录自动更新；选择课程后，下方只显示对应资料。</p>
          </div>
          <span>{{ courses.length }} 门课程</span>
        </div>
        <div class="course-grid">
          <CourseCard
            v-for="item in courseSummaries"
            :key="item.course.id"
            :course="item.course"
            :resource-count="item.resourceCount"
            :latest-updated-at="item.latestUpdatedAt"
            :active="filters.courseId === item.course.id"
            @select="selectCourse(item.course.id, item.resourceCount)"
          />
        </div>
      </section>

      <div class="filter-panel resource-filter-panel reveal">
        <label class="search-field">
          <span class="sr-only">搜索当前分类中的资料</span><i aria-hidden="true">⌕</i>
          <input v-model="filters.query" type="search" :placeholder="`在${resultTitle}中搜索标题、科目或标签…`" />
          <button v-if="filters.query" type="button" aria-label="清空搜索" @click="filters.query = ''">×</button>
        </label>
        <div class="select-row">
          <label v-if="filters.category !== 'course'">方向<select v-model="filters.subject"><option value="all">全部方向</option><option v-for="item in subjects" :key="item">{{ item }}</option></select></label>
          <label>格式<select v-model="filters.fileType"><option value="all">全部格式</option><option v-for="item in fileTypes" :key="item">{{ item }}</option></select></label>
          <label>排序<select v-model="sortBy"><option value="updated">最近更新</option><option value="name">按名称</option></select></label>
        </div>
      </div>

      <section id="resource-results" ref="resultsSection" class="resource-results" aria-labelledby="resource-results-title">
        <div class="resource-results-heading">
          <div>
            <span class="eyebrow"><i></i>RESOURCE RESULTS</span>
            <h2 id="resource-results-title" ref="resultsHeading" tabindex="-1">{{ resultTitle }}</h2>
            <p aria-live="polite">找到 <strong>{{ results.length }}</strong> 份资料</p>
          </div>
          <div class="resource-result-actions">
            <button v-if="filters.category === 'course' && filters.courseId !== 'all'" type="button" @click="showAllCourses">查看全部课程</button>
            <button type="button" @click="resetFilters">重置筛选 ↺</button>
          </div>
        </div>

        <div v-if="results.length" class="resource-grid full-grid">
          <ResourceCard v-for="resource in results" :key="resource.id" :resource="resource" />
        </div>
        <div v-else class="empty-state" role="status"><span>⌕</span><h2>暂时没有匹配的资料</h2><p>换个关键词或清除筛选条件再试试。</p><button class="button button-primary" type="button" @click="resetFilters">恢复校内课程</button></div>
      </section>
    </section>
  </div>
</template>
