<script setup lang="ts">
import { computed } from 'vue'
import type { ResearchFile } from '~/types/research'

const props = defineProps<{
  linkedIds: string[]
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'update:linkedIds', val: string[]): void
  (e: 'open-file', fileId: string): void
}>()

const availableFiles = computed(() =>
  props.notebookFiles.filter(f => !props.linkedIds.includes(f.id))
)

const linkedFiles = computed(() =>
  props.linkedIds.map(id => props.notebookFiles.find(f => f.id === id) || { id, title: 'ไฟล์ที่ไม่พบหรือถูกลบ', fileName: '' })
)

const addLink = (fileId: string) => {
  if (!fileId || props.linkedIds.includes(fileId)) return
  emit('update:linkedIds', [...props.linkedIds, fileId])
}

const removeLink = (fileId: string) => {
  emit('update:linkedIds', props.linkedIds.filter(id => id !== fileId))
}
</script>

<template>
  <div class="space-y-2 pt-2 border-t border-zinc-100">
    <div class="flex items-center justify-between gap-2">
      <label class="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
        <span>📎 เปเปอร์อ้างอิงที่ผูกกับหัวข้อนี้ (Linked Papers)</span>
        <span class="text-[10px] text-zinc-400 font-normal">({{ linkedIds.length }})</span>
      </label>

      <!-- Picker to link a paper -->
      <div v-if="availableFiles.length" class="relative">
        <select
          class="text-xs px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 focus:outline-none cursor-pointer"
          @change="addLink(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
        >
          <option value="" disabled selected>+ ผูกเปเปอร์อ้างอิง...</option>
          <option v-for="f in availableFiles" :key="f.id" :value="f.id">
            📄 {{ f.title }}
          </option>
        </select>
      </div>
      <span v-else-if="!notebookFiles.length" class="text-[11px] text-zinc-400">ยังไม่มีไฟล์ใน Notebook</span>
    </div>

    <!-- Tags list -->
    <div v-if="linkedFiles.length" class="flex flex-wrap gap-1.5">
      <div
        v-for="f in linkedFiles"
        :key="f.id"
        class="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors border border-zinc-200/80 cursor-pointer"
        title="คลิกเพื่อเปิดอ่านเปเปอร์นี้ใน PDF Viewer"
        @click="emit('open-file', f.id)"
      >
        <span class="text-zinc-500">📄</span>
        <span class="font-medium truncate max-w-[200px]">{{ f.title }}</span>
        <button
          type="button"
          class="text-zinc-400 hover:text-red-600 ml-0.5 font-bold rounded p-0.5"
          title="ยกเลิกการผูก"
          @click.stop="removeLink(f.id)"
        >
          ✕
        </button>
      </div>
    </div>
    <div v-else class="text-[11px] text-zinc-400 italic">
      ยังไม่ได้ผูกเปเปอร์อ้างอิง (เลือกจากดรอปดาวน์ด้านบน เพื่อคลิกเปิดอ่านได้สะดวก)
    </div>
  </div>
</template>
