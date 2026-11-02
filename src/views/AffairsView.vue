<script setup lang="ts">
import { computed, ref } from 'vue'
import PageIntro from '../components/PageIntro.vue'
import AffairCard from '../components/AffairCard.vue'
import affairsData from '../content/affairs.json'
import type { ClassAffair } from '../types/content'
import { affairTypeLabels, getAffairStatus } from '../utils/content'

const affairs = affairsData as ClassAffair[]
const typeFilter = ref('all')
const expandedIds = ref(new Set<string>())
const filtered = computed(() => affairs.filter((item) => typeFilter.value === 'all' || item.type === typeFilter.value))
const current = computed(() => filtered.value.filter((item) => getAffairStatus(item) !== 'ended').sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)))
const history = computed(() => filtered.value.filter((item) => getAffairStatus(item) === 'ended').sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt)))

function toggle(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}
</script>

<template>
  <div>
    <PageIntro eyebrow="CLASS BOARD" title="重要的事，" accent="不再被消息淹没。" description="按时间整理班级安排，清楚看到什么时候开始、在哪里集合、哪一天截止。" />

    <section class="container content-section affairs-page">
      <div class="category-tabs affairs-tabs" role="group" aria-label="事务类型">
        <button v-for="(label, value) in affairTypeLabels" :key="value" type="button" :class="{ active: typeFilter === value }" @click="typeFilter = value">{{ label }}</button>
      </div>

      <div class="affair-section-heading"><div><span class="live-dot"></span><h2>接下来要做的事</h2></div><span>{{ current.length }} 项</span></div>
      <div v-if="current.length" class="affairs-list">
        <AffairCard v-for="affair in current" :key="affair.id" :affair="affair" :expanded="expandedIds.has(affair.id)" @toggle="toggle(affair.id)" />
      </div>
      <div v-else class="small-empty">这个分类下暂时没有近期事务。</div>

      <div class="history-heading"><span></span><h2>历史归档</h2><span></span></div>
      <div v-if="history.length" class="affairs-list history-list">
        <AffairCard v-for="affair in history" :key="affair.id" :affair="affair" :expanded="expandedIds.has(affair.id)" @toggle="toggle(affair.id)" />
      </div>
      <div v-else class="small-empty">这个分类下暂时没有历史记录。</div>

      <aside class="affairs-notice" role="note" aria-labelledby="affairs-notice-title">
        <span class="affairs-notice-icon" aria-hidden="true">i</span>
        <div>
          <strong id="affairs-notice-title">状态说明</strong>
          <p>事务状态会根据中国标准时间自动切换；正式通知请以学院和班级发布渠道为准。</p>
        </div>
      </aside>
    </section>
  </div>
</template>

