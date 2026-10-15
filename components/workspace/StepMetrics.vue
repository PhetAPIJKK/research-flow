<script setup lang="ts">
import type { ResearchFile } from '~/types/research'
import { newId } from '~/composables/useWorkflow'

const props = defineProps<{
  step: {
    status: string
    linked: string[]
    data: {
      metrics: { id: string; name: string; formula: string; why: string }[]
    }
  }
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

const addMetric = () => {
  if (!props.step.data.metrics) props.step.data.metrics = []
  props.step.data.metrics.push({
    id: newId(),
    name: '',
    formula: '',
    why: ''
  })
}

const removeMetric = (index: number) => {
  props.step.data.metrics.splice(index, 1)
}

const PRESET_METRICS = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'RMSE', 'MAE', 'mAP', 'Latency']
const applyPreset = (idx: number, preset: string) => {
  if (props.step.data.metrics[idx]) {
    props.step.data.metrics[idx].name = preset
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          รายการตัวชี้วัดประสิทธิภาพ (Selected Metrics)
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 font-medium transition-colors"
          @click="addMetric"
        >
          + เพิ่มตัวชี้วัด
        </button>
      </div>

      <div v-if="step.data.metrics && step.data.metrics.length" class="space-y-3">
        <div
          v-for="(m, idx) in step.data.metrics"
          :key="m.id"
          class="bg-zinc-50 rounded-lg border border-zinc-200 p-3 space-y-2.5"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <span class="text-xs font-bold text-zinc-500">#{{ idx + 1 }}</span>
              <input
                v-model="m.name"
                type="text"
                placeholder="ชื่อตัวชี้วัด เช่น F1-Score, RMSE, Latency..."
                class="flex-1 min-w-0 px-2.5 py-1 text-xs font-semibold border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
            <button
              type="button"
              class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
              title="ลบตัวชี้วัดนี้"
              @click="removeMetric(idx)"
            >
              🗑
            </button>
          </div>

          <!-- Quick presets -->
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-[10px] text-zinc-400">เลือกด่วน:</span>
            <button
              v-for="p in PRESET_METRICS"
              :key="p"
              type="button"
              class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700"
              @click="applyPreset(idx, p)"
            >
              {{ p }}
            </button>
          </div>

          <div>
            <label class="block text-[11px] font-medium text-zinc-600 mb-0.5">สูตรคำนวณ (Formula / LaTeX)</label>
            <input
              v-model="m.formula"
              type="text"
              placeholder="เช่น 2 * (P * R) / (P + R) หรือ \frac{TP}{TP + FP}"
              class="w-full px-2.5 py-1 text-xs font-mono border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          <div>
            <label class="block text-[11px] font-medium text-zinc-600 mb-0.5">เหตุผลที่เลือกใช้ (Justification)</label>
            <textarea
              v-model="m.why"
              rows="2"
              placeholder="ระบุเหตุผล เช่น ข้อมูลมีความไม่สมดุล (Imbalance), ต้องการวัดความเร็วการตอบสนองจริง..."
              class="w-full px-2.5 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 placeholder:text-zinc-400"
            ></textarea>
          </div>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-2.5 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มีตัวชี้วัด กด "+ เพิ่มตัวชี้วัด" เพื่อระบุตัววัดผลของงานวิจัย
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
