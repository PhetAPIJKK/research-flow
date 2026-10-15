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
      objectives: { id: string; text: string; done: boolean; linkedRq?: string }[]
      hypothesis?: string
      scopeIn?: string
      scopeOut?: string
      contributions?: string
      scope?: string
    }
  }
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

const addObjective = () => {
  if (!props.step.data.objectives) props.step.data.objectives = []
  const count = props.step.data.objectives.length + 1
  props.step.data.objectives.push({
    id: newId(),
    text: '',
    done: false,
    linkedRq: `RQ${count}`
  })
}

const removeObjective = (index: number) => {
  props.step.data.objectives.splice(index, 1)
}

const handleInsertTemplate = () => {
  const t = GUIDELINES.objective.template
  if (t) {
    props.step.data.objectives = t.objectives.map((o: any) => ({ ...o, id: newId() }))
    props.step.data.hypothesis = t.hypothesis
    props.step.data.scopeIn = t.scopeIn
    props.step.data.scopeOut = t.scopeOut
    props.step.data.contributions = t.contributions
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Guideline & Mindset Accordion -->
    <WorkspaceGuidelineAccordion
      step-key="objective"
      :completed-dod-ids="step.dod"
      @update:completed-dod-ids="step.dod = $event"
      @insert-template="handleInsertTemplate"
    />

    <!-- Research Objectives Checklist (with RQ linking) -->
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
          <!-- Linked RQ Tag/Selector -->
          <input
            v-model="obj.linkedRq"
            type="text"
            placeholder="ตอบ RQ"
            class="w-18 px-1.5 py-1 text-[11px] font-semibold border border-zinc-200 rounded bg-white text-center text-zinc-600"
            title="ระบุว่าตอบคำถามวิจัยข้อไหน เช่น RQ1, RQ2"
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
        ยังไม่มีวัตถุประสงค์ กด "+ เพิ่มวัตถุประสงค์" หรือกดดึง Template ด้านบน
      </div>
    </div>

    <!-- Research Hypothesis -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        สมมติฐานการวิจัย (Research Hypothesis)
      </label>
      <textarea
        v-model="step.data.hypothesis"
        rows="2"
        placeholder="ระบุสมมติฐานที่คาดหวังและสามารถพิสูจน์ได้เชิงประจักษ์ เช่น คาดว่าการใช้โมดูล... จะช่วยลดเวลาลง 20%..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Scope: In-Scope vs Out-of-Scope (2 Columns) -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        ขอบเขตงานวิจัย (Research Scope)
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div class="space-y-1 bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200">
          <span class="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
            <span>✓ ขอบเขตที่ทำ (In-Scope)</span>
          </span>
          <textarea
            v-model="step.data.scopeIn"
            rows="3"
            placeholder="ระบุสิ่งที่ครอบคลุม ชุดข้อมูล สภาพแวดล้อม และเงื่อนไขที่ศึกษา..."
            class="w-full p-2 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 placeholder:text-zinc-400"
          ></textarea>
        </div>

        <div class="space-y-1 bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200">
          <span class="text-[11px] font-bold text-amber-800 flex items-center gap-1">
            <span>✕ สิ่งที่ไม่รวม / ข้อจำกัด (Out-of-Scope)</span>
          </span>
          <textarea
            v-model="step.data.scopeOut"
            rows="3"
            placeholder="ระบุสิ่งที่ยังไม่รวมในงานนี้ เช่น ไม่รองรับข้อมูล Real-time, ข้อจำกัดของฮาร์ดแวร์..."
            class="w-full p-2 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 placeholder:text-zinc-400"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Expected Contributions -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        คุณูปการหลักที่คาดหวัง (Expected Contributions)
      </label>
      <textarea
        v-model="step.data.contributions"
        rows="3"
        placeholder="สรุปประโยชน์หรือองค์ความรู้ใหม่ที่งานวิจัยนี้จะสร้างขึ้น 2-4 ข้อ..."
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
