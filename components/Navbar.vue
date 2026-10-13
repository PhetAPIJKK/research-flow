<script setup lang="ts">
const route = useRoute()
const links = [
  { name: 'หน้าหลัก', to: '/' },
  { name: 'คลังไฟล์', to: '/files' },
  { name: 'ตั้งค่า', to: '/settings' }
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-sm font-bold">RF</div>
        <span class="font-semibold text-zinc-900">Research Flow</span>
      </NuxtLink>
      <nav class="flex items-center gap-1">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="px-3 py-1.5 rounded-md text-sm transition-colors"
          :class="route.path === l.to ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'"
        >
          {{ l.name }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
