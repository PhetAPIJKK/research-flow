<script setup lang="ts">
const route = useRoute()
const links = [
  { name: 'หน้าหลัก', to: '/' },
  { name: 'Notebook', to: '/notebooks' },
  { name: 'คลังไฟล์', to: '/files' },
  { name: 'ตั้งค่า', to: '/settings' }
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
    <div :class="route.path === '/files' ? 'w-full px-3 sm:px-4 h-12 flex items-center justify-between' : 'max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between'">
      <NuxtLink to="/" class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">RF</div>
        <span class="font-semibold text-zinc-900 text-sm tracking-tight">Research Flow</span>
        <span class="hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">v2.0</span>
      </NuxtLink>
      <nav class="flex items-center gap-1">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="px-2.5 py-1 rounded-md text-xs sm:text-sm transition-colors"
          :class="route.path === l.to ? 'bg-zinc-900 text-white font-medium shadow-sm' : 'text-zinc-600 hover:bg-zinc-100'"
        >
          {{ l.name }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
