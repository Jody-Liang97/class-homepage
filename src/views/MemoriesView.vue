<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import PageIntro from '../components/PageIntro.vue'
import Lightbox from '../components/Lightbox.vue'
import albumsData from '../content/albums.json'
import type { Album } from '../types/content'
import { formatDate, resolveUrl } from '../utils/content'

const albums = albumsData as Album[]
const semester = ref('all')
const selectedAlbum = ref<Album>(albums[0])
const lightboxIndex = ref<number | null>(null)
const semesters = [...new Set(albums.map((item) => item.semester))]
const filtered = computed(() => albums.filter((item) => semester.value === 'all' || item.semester === semester.value))

async function selectAlbum(album: Album) {
  selectedAlbum.value = album
  await nextTick()
  document.querySelector('#album-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div>
    <PageIntro eyebrow="OUR MEMORIES" title="我们走过的路，" accent="都有光。" description="按时间收好共同经历的温暖片刻，珍藏属于我们班级独一无二的青春故事。" />
    <section class="container content-section">
      <div class="memory-filter">
        <span>按学期浏览</span>
        <div class="category-tabs" role="group" aria-label="按学期筛选相册">
          <button type="button" :class="{ active: semester === 'all' }" @click="semester = 'all'">全部</button>
          <button v-for="item in semesters" :key="item" type="button" :class="{ active: semester === item }" @click="semester = item">{{ item }}</button>
        </div>
      </div>

      <div class="album-grid">
        <button v-for="album in filtered" :key="album.id" class="album-card" type="button" :class="{ selected: selectedAlbum.id === album.id }" @click="selectAlbum(album)">
          <span class="album-image"><img :src="resolveUrl(album.cover)" :alt="`${album.title}封面`" loading="lazy" /><i>{{ album.photos.length }} 张</i></span>
          <span class="album-copy"><small>{{ formatDate(album.date) }} · {{ album.location }}</small><strong>{{ album.title }}</strong><em>{{ album.description }}</em></span>
        </button>
      </div>

      <section id="album-detail" class="album-detail" tabindex="-1">
        <div class="section-heading">
          <div><span class="eyebrow"><i></i>SELECTED ALBUM</span><h2>{{ selectedAlbum.title }}</h2><p>{{ selectedAlbum.description }}</p></div>
          <span class="album-count">{{ selectedAlbum.photos.length }} PHOTOS</span>
        </div>
        <div class="photo-grid">
          <button v-for="(photo, index) in selectedAlbum.photos" :key="photo.src" type="button" @click="lightboxIndex = index">
            <img :src="resolveUrl(photo.thumbnail)" :alt="photo.alt" loading="lazy" />
            <span>{{ photo.caption }} <i>↗</i></span>
          </button>
        </div>
      </section>
    </section>

    <Lightbox v-if="lightboxIndex !== null" :photos="selectedAlbum.photos" :index="lightboxIndex" @close="lightboxIndex = null" @change="lightboxIndex = $event" />
  </div>
</template>

