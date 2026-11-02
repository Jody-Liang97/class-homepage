<script setup lang="ts">
import { computed } from 'vue'
import type { Resource } from '../types/content'
import { categoryLabels, formatDate, resolveUrl } from '../utils/content'

const props = defineProps<{ resource: Resource; compact?: boolean }>()

const authorDisplay = computed(() => {
  const s = props.resource.source || ''
  if (s.includes('·')) return s.split('·')[1].trim()
  if (s.startsWith('作者：')) return s.replace('作者：', '').trim()
  return s
})
</script>

<template>
  <article class="resource-card" :class="{ compact }">
    <div class="resource-head">
      <span class="file-badge">{{ resource.fileType.slice(0, 2).toUpperCase() }}</span>
      <div>
        <span class="card-overline">{{ categoryLabels[resource.category] }} · {{ resource.subject }}</span>
        <h3>{{ resource.title }}</h3>
      </div>
    </div>
    <p>{{ resource.description }}</p>
    <div v-if="!compact" class="tag-row">
      <span v-for="tag in resource.tags" :key="tag">{{ tag }}</span>
    </div>
    <div class="resource-meta">
      <span>{{ resource.fileSize }}</span>
      <span>{{ formatDate(resource.updatedAt) }}更新</span>
    </div>
    <div class="resource-actions">
      <span class="resource-author-badge">
        <span class="author-label">作者：</span><strong>{{ authorDisplay }}</strong>
      </span>
      <a class="text-link" :href="resolveUrl(resource.downloadUrl)" download>
        下载资料 <span aria-hidden="true">↓</span>
      </a>
    </div>
  </article>
</template>

