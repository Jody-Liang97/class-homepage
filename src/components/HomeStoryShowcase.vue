<script setup lang="ts">
import ResourceCard from './ResourceCard.vue'
import AffairCard from './AffairCard.vue'
import type { Album, ClassAffair, Resource } from '../types/content'
import { resolveUrl } from '../utils/content'

defineProps<{
  kind: 'resources' | 'affairs' | 'memories'
  resources: Resource[]
  affairs: ClassAffair[]
  albums: Album[]
  slogan: string
}>()
</script>

<template>
  <div class="story-showcase-content" :class="`story-showcase-${kind}`">
    <div v-if="kind === 'resources'" class="resource-grid story-resource-grid">
      <ResourceCard v-for="resource in resources" :key="resource.id" :resource="resource" compact />
    </div>

    <div v-else-if="kind === 'affairs'" class="home-affairs story-affairs-list">
      <AffairCard v-for="affair in affairs" :key="affair.id" :affair="affair" />
    </div>

    <div v-else class="memory-collage story-memory-collage">
      <RouterLink v-for="(album, index) in albums.slice(0, 2)" :key="album.id" class="memory-tile" :class="`tile-${index + 1}`" to="/memories">
        <img :src="resolveUrl(album.cover)" :alt="album.description" loading="lazy" />
        <span><small>{{ album.date }}</small><strong>{{ album.title }}</strong></span>
      </RouterLink>
      <div class="memory-quote"><span>“</span><p>{{ slogan }}</p></div>
    </div>
  </div>
</template>

