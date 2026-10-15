<script setup lang="ts">
import { onMounted } from 'vue'

const route = useRoute()
const { init } = useFiles()
const { initConfig } = useSupabaseSync()
const { initGitConfig } = useGitSync()

onMounted(() => {
  init()
  initConfig()
  initGitConfig()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-zinc-50/50">
    <Navbar />
    <main :class="route.path === '/files' ? 'flex-1 w-full p-2 sm:p-3 overflow-hidden flex flex-col' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6'">
      <NuxtPage />
    </main>
  </div>
</template>
