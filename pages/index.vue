<script setup lang="ts">
import { computed } from 'vue'

const { files, sortedFiles, notebooks, notebookName } = useFiles()

const pinnedCount = computed(() => files.value.filter(f => f.pinned).length)
const recent = computed(() => sortedFiles.value.slice(0, 5))
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="bg-white border border-zinc-200 rounded-xl p-8">
      <h1 class="text-2xl font-bold text-zinc-900">คลังเอกสารงานวิจัย</h1>
      <p class="text-sm text-zinc-500 mt-1">อัปโหลด จัดกลุ่ม ปักหมุด และเปิดอ่านไฟล์ PDF ได้ในเว็บทันที</p>
    </div>

    <!-- Empty state -->
    <div v-if="files.length === 0" class="bg-white border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center space-y-3">
      <div class="text-4xl">📄</div>
      <div class="font-semibold text-zinc-800">ยังไม่มีไฟล์ในระบบ</div>
      <p class="text-sm text-zinc-500">เริ่มต้นด้วยการอัปโหลดไฟล์งานวิจัยไฟล์แรกของคุณ</p>
      <NuxtLink to="/files" class="inline-block px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800">
        + อัปโหลดไฟล์แรก
      </NuxtLink>
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white border border-zinc-200 rounded-xl p-5 text-center">
          <div class="text-3xl font-bold">{{ files.length }}</div>
          <div class="text-xs text-zinc-500 mt-1">ไฟล์ทั้งหมด</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-xl p-5 text-center">
          <div class="text-3xl font-bold text-amber-600">{{ pinnedCount }}</div>
          <div class="text-xs text-zinc-500 mt-1">📌 ปักหมุด</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-xl p-5 text-center">
          <div class="text-3xl font-bold">{{ notebooks.length }}</div>
          <div class="text-xs text-zinc-500 mt-1">Notebook</div>
        </div>
      </div>

      <div class="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">ไฟล์ล่าสุด</h2>
          <NuxtLink to="/files" class="text-xs text-zinc-600 hover:underline">ดูทั้งหมด →</NuxtLink>
        </div>
        <NuxtLink
          v-for="f in recent"
          :key="f.id"
          :to="`/files?id=${f.id}`"
          class="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
        >
          <div class="min-w-0">
            <div class="font-medium text-sm truncate">
              <span v-if="f.pinned">📌 </span>{{ f.title }}
            </div>
            <div class="text-xs text-zinc-500">{{ formatSize(f.size) }} • {{ formatDate(f.uploadedAt) }}</div>
          </div>
          <span class="shrink-0 text-xs px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-600">{{ notebookName(f.notebookId) }}</span>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
