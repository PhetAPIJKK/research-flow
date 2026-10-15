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
      dsName: string
      dsSource: string
      dsSize: string
      dsSplit: string
      dsClean: string
      env: string
      hyper: { id: string; k: string; v: string }[]
      baselines: { id: string; text: string }[]
    }
  }
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

const addHyper = () => {
  if (!props.step.data.hyper) props.step.data.hyper = []
  props.step.data.hyper.push({ id: newId(), k: '', v: '' })
}

const removeHyper = (index: number) => {
  props.step.data.hyper.splice(index, 1)
}

const addBaseline = () => {
  if (!props.step.data.baselines) props.step.data.baselines = []
  props.step.data.baselines.push({ id: newId(), text: '' })
}

const removeBaseline = (index: number) => {
  props.step.data.baselines.splice(index, 1)
}

const handleInsertTemplate = () => {
  const t = GUIDELINES.setup.template
  if (t) {
    props.step.data.dsName = t.dsName
    props.step.data.dsSource = t.dsSource
    props.step.data.dsSize = t.dsSize
    props.step.data.dsSplit = t.dsSplit
    props.step.data.dsClean = t.dsClean
    props.step.data.env = t.env
    props.step.data.hyper = t.hyper.map((h: any) => ({ ...h, id: newId() }))
    props.step.data.baselines = t.baselines.map((b: any) => ({ ...b, id: newId() }))
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Guideline & Mindset Accordion -->
    <WorkspaceGuidelineAccordion
      step-key="setup"
      :completed-dod-ids="step.dod"
      @update:completed-dod-ids="step.dod = $event"
      @insert-template="handleInsertTemplate"
    />

    <!-- Dataset Details -->
    <div class="space-y-2.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        ข้อมูลชุดข้อมูล (Dataset Details)
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
        <div>
          <label class="block text-[11px] font-medium text-zinc-600 mb-1">ชื่อชุดข้อมูล (Dataset Name)</label>
          <input
            v-model="step.data.dsName"
            type="text"
            placeholder="เช่น ImageNet-1K, MIMIC-III, ThaiNER..."
            class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
          />
        </div>
        <div>
          <label class="block text-[11px] font-medium text-zinc-600 mb-1">แหล่งที่มา (Source / URL)</label>
          <input
            v-model="step.data.dsSource"
            type="text"
            placeholder="เช่น Kaggle, HuggingFace, GitHub..."
            class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
          />
        </div>
        <div>
          <label class="block text-[11px] font-medium text-zinc-600 mb-1">ขนาดข้อมูลและคลาส (Size & Classes)</label>
          <input
            v-model="step.data.dsSize"
            type="text"
            placeholder="เช่น 10,000 ตัวอย่าง / 5 คลาส..."
            class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
          />
        </div>
        <div>
          <label class="block text-[11px] font-medium text-zinc-600 mb-1">สัดส่วนแบ่งข้อมูล (Train / Val / Test Split)</label>
          <input
            v-model="step.data.dsSplit"
            type="text"
            placeholder="เช่น 70% : 15% : 15% หรือ 5-Fold CV"
            class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-[11px] font-medium text-zinc-600 mb-1">การเตรียมและทำความสะอาดข้อมูล (Data Cleaning & Preprocessing Note)</label>
          <textarea
            v-model="step.data.dsClean"
            rows="2"
            placeholder="ระบุการ Clean ข้อมูล, Normalization, Tokenization, Handling Imbalance..."
            class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Environment & Hardware Specs -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        สภาพแวดล้อมและสเปกเครื่อง (Environment & Hardware Specs)
      </label>
      <input
        v-model="step.data.env"
        type="text"
        placeholder="เช่น GPU NVIDIA RTX 4090 24GB, RAM 64GB, Python 3.10, PyTorch 2.2..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400"
      />
    </div>

    <!-- Hyperparameters Table -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          พารามิเตอร์ตั้งต้น (Hyperparameters)
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 font-medium transition-colors"
          @click="addHyper"
        >
          + เพิ่มพารามิเตอร์
        </button>
      </div>

      <div v-if="step.data.hyper && step.data.hyper.length" class="space-y-1.5">
        <div
          v-for="(h, idx) in step.data.hyper"
          :key="h.id"
          class="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200"
        >
          <input
            v-model="h.k"
            type="text"
            placeholder="Parameter (e.g. Learning Rate)"
            class="w-1/2 px-2 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono"
          />
          <input
            v-model="h.v"
            type="text"
            placeholder="Value (e.g. 1e-4)"
            class="w-1/2 px-2 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono"
          />
          <button
            type="button"
            class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-1 rounded hover:bg-red-50"
            title="ลบ"
            @click="removeHyper(idx)"
          >
            🗑
          </button>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-2.5 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มีการตั้งค่า Hyperparameter กด "+ เพิ่มพารามิเตอร์"
      </div>
    </div>

    <!-- Baseline Models -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          โมเดลตัวเปรียบเทียบ (Baseline Models)
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 font-medium transition-colors"
          @click="addBaseline"
        >
          + เพิ่ม Baseline
        </button>
      </div>

      <div v-if="step.data.baselines && step.data.baselines.length" class="space-y-1.5">
        <div
          v-for="(b, idx) in step.data.baselines"
          :key="b.id"
          class="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200"
        >
          <span class="text-xs font-mono text-zinc-400">#{{ idx + 1 }}</span>
          <input
            v-model="b.text"
            type="text"
            placeholder="เช่น ResNet-50, BERT-base, Random Forest..."
            class="flex-1 min-w-0 px-2.5 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
          />
          <button
            type="button"
            class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-1 rounded hover:bg-red-50"
            title="ลบ"
            @click="removeBaseline(idx)"
          >
            🗑
          </button>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-2.5 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มี Baseline Model ที่นำมาเปรียบเทียบ
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
