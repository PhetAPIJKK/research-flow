<script setup lang="ts">
import { onMounted } from 'vue'

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
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
      <NuxtPage />
    </main>
  </div>
</template>
