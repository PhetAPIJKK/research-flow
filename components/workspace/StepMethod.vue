<script setup lang="ts">
import { ref } from 'vue'
import type { ResearchFile } from '~/types/research'
import { newId } from '~/composables/useWorkflow'
import { GUIDELINES } from '~/composables/useResearchGuidelines'

const props = defineProps<{
  step: {
    status: string
    linked: string[]
    dod?: string[]
    data: {
      images: string[]
      preprocessing?: string
      blocks: { id: string; title: string; body: string; type?: 'standard' | 'novelty' }[]
    }
  }
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

const { putAsset, deleteAsset } = useFiles()
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const onUploadDiagram = async (file: File | undefined | null) => {
  if (!file) return
  uploading.value = true
  try {
    const assetId = await putAsset(file)
    if (!props.step.data.images) props.step.data.images = []
    props.step.data.images.push(assetId)
  } catch (err) {
    console.error('Upload diagram error', err)
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const removeImage = async (assetId: string, index: number) => {
  if (!confirm('ลบรูปภาพนี้ออกจากขั้นตอน Method?')) return
  try {
    await deleteAsset(assetId)
  } catch (err) {
    console.error('Delete asset error', err)
  }
  props.step.data.images.splice(index, 1)
}

const addBlock = (type: 'standard' | 'novelty' = 'standard') => {
  if (!props.step.data.blocks) props.step.data.blocks = []
  const count = props.step.data.blocks.length + 1
  props.step.data.blocks.push({
    id: newId(),
    title: `ขั้นตอนที่ 3.${count}`,
    body: '',
    type
  })
}

const removeBlock = (index: number) => {
  props.step.data.blocks.splice(index, 1)
}

const handleInsertTemplate = () => {
  const t = GUIDELINES.method.template
  if (t) {
    props.step.data.preprocessing = t.preprocessing
    props.step.data.blocks = t.blocks.map((b: any) => ({ ...b, id: newId() }))
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Guideline & Mindset Accordion -->
    <WorkspaceGuidelineAccordion
      step-key="method"
      :completed-dod-ids="step.dod"
      @update:completed-dod-ids="step.dod = $event"
      @insert-template="handleInsertTemplate"
    />

    <!-- Architecture / Pipeline Diagram -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          ผังโครงสร้างสถาปัตยกรรม / Pipeline Diagram
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium flex items-center gap-1 transition-colors"
          :disabled="uploading"
          @click="fileInput?.click()"
        >
          {{ uploading ? 'กำลังอัปโหลด...' : '+ อัปโหลดรูปภาพ' }}
        </button>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onUploadDiagram(($event.target as HTMLInputElement).files?.[0])"
      />

      <!-- Image Gallery -->
      <div v-if="step.data.images && step.data.images.length" class="flex flex-wrap gap-2.5 p-2 bg-zinc-50 rounded-lg border border-zinc-200">
        <AssetImage
          v-for="(imgId, idx) in step.data.images"
          :key="imgId"
          :asset-id="imgId"
          :alt="`Architecture Diagram #${idx + 1}`"
          @remove="removeImage(imgId, idx)"
        />
      </div>
      <div
        v-else
        class="border border-dashed border-zinc-200 rounded-lg p-3 text-center cursor-pointer hover:bg-zinc-50 transition-colors"
        @click="fileInput?.click()"
      >
        <div class="text-xs text-zinc-600 font-medium">🖼 คลิกเพื่ออัปโหลด Diagram หรือ Flowchart</div>
        <div class="text-[10px] text-zinc-400 mt-0.5">รองรับไฟล์ PNG, JPG, WebP, SVG (บันทึกในเครื่องทันที)</div>
      </div>
    </div>

    <!-- Data Preprocessing Pipeline -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        ขั้นตอนการจัดเตรียมข้อมูล (Data Preprocessing Pipeline)
      </label>
      <textarea
        v-model="step.data.preprocessing"
        rows="3"
        placeholder="อธิบายขั้นตอน Data Cleaning, Tokenization, Normalization, Data Augmentation..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Proposed Methodology Steps (Structured Blocks) -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          ขั้นตอนและโมดูลระเบียบวิธีวิจัย (Methodology Modules)
        </label>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="text-[11px] px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium flex items-center gap-1 transition-colors"
            @click="addBlock('standard')"
          >
            + Standard Module
          </button>
          <button
            type="button"
            class="text-[11px] px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
            @click="addBlock('novelty')"
          >
            ★ + Novelty Module
          </button>
        </div>
      </div>

      <div v-if="step.data.blocks && step.data.blocks.length" class="space-y-3">
        <div
          v-for="(block, idx) in step.data.blocks"
          :key="block.id"
          class="rounded-lg border p-3 space-y-2 transition-colors"
          :class="block.type === 'novelty' ? 'bg-indigo-50/40 border-indigo-200' : 'bg-zinc-50 border-zinc-200/80'"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-zinc-500 select-none">3.{{ idx + 1 }}</span>
            <input
              v-model="block.title"
              type="text"
              placeholder="ชื่อโมดูล เช่น Proposed Attention Mechanism..."
              class="flex-1 min-w-0 px-2 py-1 text-xs font-semibold border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
            />
            <!-- Component Type Selector -->
            <select
              v-model="block.type"
              class="text-[10px] font-semibold px-2 py-1 rounded border cursor-pointer"
              :class="block.type === 'novelty' ? 'bg-indigo-100 text-indigo-900 border-indigo-300' : 'bg-zinc-200 text-zinc-700 border-zinc-300'"
            >
              <option value="standard">Standard</option>
              <option value="novelty">★ Novelty</option>
            </select>
            <button
              type="button"
              class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
              title="ลบโมดูลนี้"
              @click="removeBlock(idx)"
            >
              🗑
            </button>
          </div>
          <textarea
            v-model="block.body"
            rows="3"
            placeholder="อธิบายรายละเอียดการทำงาน สมการคณิตศาสตร์ หรืออัลกอริทึม..."
            class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 placeholder:text-zinc-400 leading-relaxed"
          ></textarea>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-2.5 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มีโมดูลระเบียบวิธีวิจัย กดปุ่มเพิ่มโมดูลด้านบน หรือดึงจาก Template
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
