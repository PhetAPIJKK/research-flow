<script setup lang="ts">
import { onMounted } from 'vue'
import { useResearchWorkflow } from '~/composables/useResearchWorkflow'
import { useGitSync } from '~/composables/useGitSync'
import { useSupabaseSync } from '~/composables/useSupabaseSync'

const { init: initWorkflow } = useResearchWorkflow()
const { initGitConfig } = useGitSync()
const { initConfig: initSupabase } = useSupabaseSync()

onMounted(() => {
  initWorkflow()
  initGitConfig()
  initSupabase()
})
</script>

<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-200">
    <Navbar />
    
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NuxtPage />
    </main>

    <!-- Clean Minimal Footer -->
    <footer class="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Research Flow &copy; 2026 — ระบบวางแผนและติดตามขั้นตอนการทำวิจัย</p>
        <p class="text-zinc-400">Nuxt 3 &bull; Supabase Storage &bull; Git Integration &bull; Docker Ready</p>
      </div>
    </footer>
  </div>
</template>
