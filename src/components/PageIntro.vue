<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
  accent?: string
}>()
</script>

<template>
  <section class="page-intro container reveal">
    <span class="eyebrow"><i></i>{{ eyebrow }}</span>
    <h1>{{ title }} <em v-if="accent">{{ accent }}</em></h1>
    <p>{{ description }}</p>
    <slot />
  </section>
</template>

