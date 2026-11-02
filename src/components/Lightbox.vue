<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed } from 'vue'
import type { AlbumPhoto } from '../types/content'
import { resolveUrl } from '../utils/content'

const props = defineProps<{ photos: AlbumPhoto[]; index: number }>()
const emit = defineEmits<{ close: []; change: [index: number] }>()
const photo = computed(() => props.photos[props.index])

function next() { emit('change', (props.index + 1) % props.photos.length) }
function previous() { emit('change', (props.index - 1 + props.photos.length) % props.photos.length) }
function handleKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') previous()
}

onMounted(() => {
  document.body.classList.add('modal-open')
  window.addEventListener('keydown', handleKey)
})
onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  window.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <div class="lightbox" role="dialog" aria-modal="true" aria-label="照片浏览器" @click.self="emit('close')">
    <button class="lightbox-close" type="button" aria-label="关闭照片" @click="emit('close')">×</button>
    <button class="lightbox-nav previous" type="button" aria-label="上一张照片" @click="previous">←</button>
    <figure>
      <img :src="resolveUrl(photo.src)" :alt="photo.alt" />
      <figcaption>
        <span>{{ photo.caption }}</span>
        <small>{{ index + 1 }} / {{ photos.length }}</small>
      </figcaption>
    </figure>
    <button class="lightbox-nav next" type="button" aria-label="下一张照片" @click="next">→</button>
  </div>
</template>

