<script setup lang="ts">
import type { Course } from '../types/content'
import { formatDate } from '../utils/content'

defineProps<{
  course: Course
  resourceCount: number
  latestUpdatedAt?: string
  active: boolean
}>()

defineEmits<{ select: [] }>()
</script>

<template>
  <button
    class="course-card"
    :class="[`course-${course.accent}`, { active }]"
    type="button"
    :disabled="resourceCount === 0"
    :aria-pressed="active"
    @click="$emit('select')"
  >
    <span class="course-card-topline">
      <i aria-hidden="true">{{ course.icon }}</i>
      <small>{{ resourceCount > 0 ? `${resourceCount} 份资料` : '待整理' }}</small>
    </span>
    <span class="course-card-copy">
      <span class="card-overline">校内课程</span>
      <strong>{{ course.name }}</strong>
      <span>{{ course.description }}</span>
    </span>
    <span class="course-card-footer">
      <small v-if="latestUpdatedAt">最近更新 {{ formatDate(latestUpdatedAt) }}</small>
      <small v-else>资料正在整理</small>
      <b>{{ resourceCount > 0 ? '查看资料 →' : '敬请期待' }}</b>
    </span>
  </button>
</template>
