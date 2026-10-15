<script setup lang="ts">
import type { ResearchFile } from '~/types/research'
import { newId } from '~/composables/useWorkflow'
import { GUIDELINES } from '~/composables/useResearchGuidelines'

const props = defineProps<{
  step: {
    status: string
    linked: string[]
    dod?: string[]
    data: {
      statement: string
      gap: string
      rqs: { id: string; text: string }[]
    }
  }
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

const addRq = () => {
  if (!props.step.data.rqs) props.step.data.rqs = []
  props.step.data.rqs.push({ id: newId(), text: '' })
}

const removeRq = (index: number) => {
  props.step.data.rqs.splice(index, 1)
}

const handleInsertTemplate = () => {
  const t = GUIDELINES.problem.template
  if (t) {
    props.step.data.statement = t.statement
    props.step.data.gap = t.gap
    props.step.data.rqs = t.rqs.map((q: any) => ({ ...q, id: newId() }))
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Guideline & Mindset Accordion -->
    <WorkspaceGuidelineAccordion
      step-key="problem"
      :completed-dod-ids="step.dod"
      @update:completed-dod-ids="step.dod = $event"
      @insert-template="handleInsertTemplate"
    />

    <!-- Problem Statement -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          ที่มาและความสำคัญของปัญหา (Problem Statement)
        </label>
        <span class="text-[11px] text-zinc-400">Markdown / Plain text</span>
      </div>
      <textarea
        v-model="step.data.statement"
        rows="4"
        placeholder="อธิบายที่มา บริบทของปัญหา และ Pain Point สำคัญที่นำไปสู่การทำวิจัยนี้..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Research Gap -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        ช่องว่างงานวิจัย (Research Gap)
      </label>
      <textarea
        v-model="step.data.gap"
        rows="3"
        placeholder="ระบุสิ่งที่งานวิจัยก่อนหน้ายังทำไม่ได้ ข้อจำกัดของวิธีเดิม หรือจุดที่ยังขาดการศึกษา..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Research Questions (Dynamic List) -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          คำถามวิจัย (Research Questions)
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 font-medium transition-colors"
          @click="addRq"
        >
          + เพิ่ม RQ
        </button>
      </div>

      <div v-if="step.data.rqs && step.data.rqs.length" class="space-y-2">
        <div
          v-for="(rq, idx) in step.data.rqs"
          :key="rq.id"
          class="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-200/80"
        >
          <span class="text-xs font-bold text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-200/70 select-none">
            RQ{{ idx + 1 }}
          </span>
          <input
            v-model="rq.text"
            type="text"
            placeholder="ระบุคำถามวิจัย..."
            class="flex-1 min-w-0 px-2.5 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
          />
          <button
            type="button"
            class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-1 rounded hover:bg-red-50"
            title="ลบข้อนี้"
            @click="removeRq(idx)"
          >
            🗑
          </button>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-2.5 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มีคำถามวิจัย กด "+ เพิ่ม RQ" ด้านบนเพื่อเพิ่มข้อแรก
      </div>
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
