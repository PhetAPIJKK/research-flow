<script setup lang="ts">
import type { ResearchFile } from '~/types/research'
import { newId } from '~/composables/useWorkflow'

const props = defineProps<{
  step: {
    status: string
    linked: string[]
    data: {
      objectives: { id: string; text: string; done: boolean }[]
      scope: string
    }
  }
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

const addObjective = () => {
  if (!props.step.data.objectives) props.step.data.objectives = []
  props.step.data.objectives.push({ id: newId(), text: '', done: false })
}

const removeObjective = (index: number) => {
  props.step.data.objectives.splice(index, 1)
}
</script>

<template>
  <div class="space-y-5">
    <!-- Research Objectives Checklist -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
          <span>วัตถุประสงค์งานวิจัย (Research Objectives)</span>
          <span v-if="step.data.objectives && step.data.objectives.length" class="text-[11px] text-zinc-400 font-normal">
            ({{ step.data.objectives.filter(o => o.done).length }}/{{ step.data.objectives.length }} สำเร็จ)
          </span>
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 font-medium transition-colors"
          @click="addObjective"
        >
          + เพิ่มวัตถุประสงค์
        </button>
      </div>

      <div v-if="step.data.objectives && step.data.objectives.length" class="space-y-2">
        <div
          v-for="(obj, idx) in step.data.objectives"
          :key="obj.id"
          class="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-200/80 transition-colors"
          :class="obj.done ? 'bg-emerald-50/40 border-emerald-200/80' : ''"
        >
          <input
            v-model="obj.done"
            type="checkbox"
            class="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-800 cursor-pointer w-4 h-4"
          />
          <span class="text-xs font-bold text-zinc-500 select-none">#{{ idx + 1 }}</span>
          <input
            v-model="obj.text"
            type="text"
            placeholder="เช่น เพื่อออกแบบและพัฒนาโมเดล..."
            class="flex-1 min-w-0 px-2.5 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
            :class="obj.done ? 'line-through text-zinc-500' : 'text-zinc-800'"
          />
          <button
            type="button"
            class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-1 rounded hover:bg-red-50"
            title="ลบข้อนี้"
            @click="removeObjective(idx)"
          >
            🗑
          </button>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-2.5 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มีวัตถุประสงค์ กด "+ เพิ่มวัตถุประสงค์" เพื่อเพิ่มรายการ
      </div>
    </div>

    <!-- Scope & Limitations -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        ขอบเขตและข้อจำกัดงานวิจัย (Scope & Limitations)
      </label>
      <textarea
        v-model="step.data.scope"
        rows="4"
        placeholder="ระบุขอบเขตของข้อมูล ข้อจำกัดของสภาพแวดล้อม หรือกรณีการใช้งานที่ครอบคลุมและไม่ครอบคลุม..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Linked Reference Papers -->
    <WorkspaceLinkedPapers
      :linked-ids="step.linked"
      :notebook-files="notebookFiles"
      @update:linked-ids="step.linked = $event"
      @open-file="emit('open-file', $event)"
    />
  </div>
</template>
