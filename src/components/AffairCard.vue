<script setup lang="ts">
import { computed } from 'vue'
import type { AffairStatus, ClassAffair } from '../types/content'
import { affairTypeLabels, formatDate, formatShortDate, getAffairStatus, resolveUrl } from '../utils/content'

const props = defineProps<{ affair: ClassAffair; expanded?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
const status = computed<AffairStatus>(() => getAffairStatus(props.affair))
const statusLabel: Record<AffairStatus, string> = { upcoming: '即将开始', active: '进行中', ended: '已结束' }
const shortDate = computed(() => formatShortDate(props.affair.startAt))
</script>

<template>
  <article class="affair-card" :class="`status-${status}`">
    <div class="date-tile" aria-hidden="true">
      <span>{{ shortDate.month }}</span><strong>{{ shortDate.day }}</strong>
    </div>
    <div class="affair-body">
      <div class="affair-labels">
        <span class="status-pill">{{ statusLabel[status] }}</span>
        <span>{{ affairTypeLabels[affair.type] }}</span>
      </div>
      <h3>{{ affair.title }}</h3>
      <p>{{ affair.summary }}</p>
      <dl class="affair-facts" aria-label="事务关键信息">
        <div class="affair-fact">
          <dt><span aria-hidden="true">◷</span>开始时间</dt>
          <dd>{{ formatDate(affair.startAt, true) }}</dd>
        </div>
        <div v-if="affair.location" class="affair-fact">
          <dt><span aria-hidden="true">⌖</span>地点</dt>
          <dd>{{ affair.location }}</dd>
        </div>
        <div v-if="affair.deadline" class="affair-fact">
          <dt><span aria-hidden="true">✓</span>截止时间</dt>
          <dd>{{ formatDate(affair.deadline, true) }}</dd>
        </div>
        <div v-else-if="affair.endAt" class="affair-fact">
          <dt><span aria-hidden="true">○</span>结束时间</dt>
          <dd>{{ formatDate(affair.endAt, true) }}</dd>
        </div>
      </dl>
      <div v-if="expanded" class="affair-details">
        <p>{{ affair.details }}</p>
        <a v-if="affair.attachmentUrl" class="text-link" :href="resolveUrl(affair.attachmentUrl)" download>下载相关附件 ↓</a>
      </div>
      <button class="detail-toggle" type="button" :aria-expanded="expanded" @click="emit('toggle')">
        {{ expanded ? '收起详情' : '查看详情' }} <span aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
      </button>
    </div>
  </article>
</template>

