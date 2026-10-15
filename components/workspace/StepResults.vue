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
      runs: { id: string; name: string; date: string; params: string; result: string; main: boolean }[]
      table: { cols: string[]; rows: string[][] }
      charts: string[]
      ablation: string
      discussion: string
    }
  }
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

const { putAsset, deleteAsset } = useFiles()
const uploading = ref(false)
const chartInput = ref<HTMLInputElement | null>(null)

// Runs
const addRun = () => {
  if (!props.step.data.runs) props.step.data.runs = []
  const count = props.step.data.runs.length + 1
  props.step.data.runs.push({
    id: newId(),
    name: `Run #${count}`,
    date: new Date().toISOString().split('T')[0],
    params: '',
    result: '',
    main: false
  })
}

const toggleMainRun = (runId: string) => {
  props.step.data.runs.forEach(r => {
    if (r.id === runId) r.main = !r.main
  })
}

const removeRun = (index: number) => {
  props.step.data.runs.splice(index, 1)
}

// Comparison Table
const addCol = () => {
  const colName = prompt('ชื่อคอลัมน์ใหม่ (เช่น Recall, AUC):', 'Metric')
  if (!colName) return
  props.step.data.table.cols.push(colName.trim())
  props.step.data.table.rows.forEach(r => r.push(''))
}

const removeCol = (cIdx: number) => {
  if (props.step.data.table.cols.length <= 1) return
  if (!confirm(`ลบคอลัมน์ "${props.step.data.table.cols[cIdx]}" ?`)) return
  props.step.data.table.cols.splice(cIdx, 1)
  props.step.data.table.rows.forEach(r => r.splice(cIdx, 1))
}

const addRow = () => {
  const newRow = props.step.data.table.cols.map((_, i) => (i === 0 ? 'Model' : ''))
  props.step.data.table.rows.push(newRow)
}

const removeRow = (rIdx: number) => {
  if (props.step.data.table.rows.length <= 1) return
  props.step.data.table.rows.splice(rIdx, 1)
}

// Chart Images
const onUploadChart = async (file: File | undefined | null) => {
  if (!file) return
  uploading.value = true
  try {
    const assetId = await putAsset(file)
    if (!props.step.data.charts) props.step.data.charts = []
    props.step.data.charts.push(assetId)
  } catch (err) {
    console.error('Upload chart error', err)
  } finally {
    uploading.value = false
    if (chartInput.value) chartInput.value.value = ''
  }
}

const removeChart = async (assetId: string, index: number) => {
  if (!confirm('ลบรูปกราฟนี้?')) return
  try {
    await deleteAsset(assetId)
  } catch (err) {
    console.error('Delete asset error', err)
  }
  props.step.data.charts.splice(index, 1)
}

const handleInsertTemplate = () => {
  const t = GUIDELINES.results.template
  if (t) {
    props.step.data.runs = t.runs.map((r: any) => ({ ...r, id: newId() }))
    props.step.data.table = JSON.parse(JSON.stringify(t.table))
    props.step.data.ablation = t.ablation
    props.step.data.discussion = t.discussion
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Guideline & Mindset Accordion -->
    <WorkspaceGuidelineAccordion
      step-key="results"
      :completed-dod-ids="step.dod"
      @update:completed-dod-ids="step.dod = $event"
      @insert-template="handleInsertTemplate"
    />

    <!-- Experiment Iteration Log -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
          <span>บันทึกรอบการทดลองย่อย (Experiment Iteration Log)</span>
          <span class="text-[10px] text-zinc-400">({{ step.data.runs?.length || 0 }} รอบ)</span>
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 font-medium transition-colors"
          @click="addRun"
        >
          + เพิ่มรอบทดลอง
        </button>
      </div>

      <div v-if="step.data.runs && step.data.runs.length" class="space-y-2">
        <div
          v-for="(run, idx) in step.data.runs"
          :key="run.id"
          class="bg-zinc-50 rounded-lg border p-2.5 space-y-2 transition-colors"
          :class="run.main ? 'border-amber-400 bg-amber-50/30' : 'border-zinc-200'"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                class="text-sm px-1.5 py-0.5 rounded transition-colors"
                :class="run.main ? 'text-amber-500 font-bold bg-amber-100' : 'text-zinc-300 hover:text-amber-400'"
                :title="run.main ? 'ผลลัพธ์หลัก (Main Result)' : 'คลิกเพื่อตั้งเป็น Main Result'"
                @click="toggleMainRun(run.id)"
              >
                ★
              </button>
              <input
                v-model="run.name"
                type="text"
                placeholder="ชื่อรอบ เช่น Run #1 - Baseline"
                class="font-semibold text-xs px-2 py-1 border border-zinc-200 rounded bg-white w-44"
              />
              <input
                v-model="run.date"
                type="date"
                class="text-xs px-2 py-1 border border-zinc-200 rounded bg-white text-zinc-600"
              />
            </div>
            <button
              type="button"
              class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
              title="ลบรอบนี้"
              @click="removeRun(idx)"
            >
              🗑
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-[10px] text-zinc-500 mb-0.5">พารามิเตอร์ที่ปรับในรอบนี้</label>
              <input
                v-model="run.params"
                type="text"
                placeholder="เช่น lr=5e-5, epochs=50, cosine scheduler..."
                class="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
            <div>
              <label class="block text-[10px] text-zinc-500 mb-0.5">ผลลัพธ์ที่ได้</label>
              <input
                v-model="run.result"
                type="text"
                placeholder="เช่น F1: 0.892, Acc: 0.915, Loss: 0.12..."
                class="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono text-emerald-700 font-medium"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-2.5 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มีบันทึกการรันผล กด "+ เพิ่มรอบทดลอง" เพื่อบันทึก Iteration
      </div>
    </div>

    <!-- Main Results Comparison Table -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          ตารางเปรียบเทียบผลลัพธ์ (Comparison Table)
        </label>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="text-[11px] px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700"
            @click="addCol"
          >
            + คอลัมน์
          </button>
          <button
            type="button"
            class="text-[11px] px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700"
            @click="addRow"
          >
            + แถว
          </button>
        </div>
      </div>

      <div class="overflow-x-auto border border-zinc-200 rounded-lg bg-white">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-100/80 text-zinc-700 border-b border-zinc-200">
            <tr>
              <th
                v-for="(col, cIdx) in step.data.table.cols"
                :key="cIdx"
                class="p-2 border-r border-zinc-200 font-semibold last:border-r-0 min-w-[100px]"
              >
                <div class="flex items-center justify-between gap-1">
                  <input
                    v-model="step.data.table.cols[cIdx]"
                    class="bg-transparent font-semibold text-xs border-0 focus:ring-1 focus:ring-zinc-800 rounded px-1 w-full"
                  />
                  <button
                    v-if="step.data.table.cols.length > 1"
                    type="button"
                    class="text-zinc-400 hover:text-red-600 text-[10px]"
                    title="ลบคอลัมน์"
                    @click="removeCol(cIdx)"
                  >
                    ✕
                  </button>
                </div>
              </th>
              <th class="p-2 w-8 text-center text-zinc-400">#</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rIdx) in step.data.table.rows"
              :key="rIdx"
              class="border-b border-zinc-100 hover:bg-zinc-50"
            >
              <td
                v-for="(cell, cIdx) in step.data.table.cols"
                :key="cIdx"
                class="p-1.5 border-r border-zinc-100 last:border-r-0"
              >
                <input
                  v-model="row[cIdx]"
                  type="text"
                  placeholder="-"
                  class="w-full px-2 py-1 text-xs border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded focus:bg-white focus:outline-none"
                  :class="cIdx === 0 ? 'font-medium text-zinc-900' : 'text-zinc-700 font-mono'"
                />
              </td>
              <td class="p-1.5 text-center">
                <button
                  type="button"
                  class="text-zinc-400 hover:text-red-600 text-xs"
                  title="ลบแถวนี้"
                  @click="removeRow(rIdx)"
                >
                  🗑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Chart Images & Curves -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800">
          กราฟผลการทดลอง (Performance Charts & Curves)
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium flex items-center gap-1 transition-colors"
          :disabled="uploading"
          @click="chartInput?.click()"
        >
          {{ uploading ? 'กำลังอัปโหลด...' : '+ อัปโหลดกราฟ' }}
        </button>
      </div>

      <input
        ref="chartInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onUploadChart(($event.target as HTMLInputElement).files?.[0])"
      />

      <div v-if="step.data.charts && step.data.charts.length" class="flex flex-wrap gap-2.5 p-2 bg-zinc-50 rounded-lg border border-zinc-200">
        <AssetImage
          v-for="(imgId, idx) in step.data.charts"
          :key="imgId"
          :asset-id="imgId"
          :alt="`Result Chart #${idx + 1}`"
          @remove="removeChart(imgId, idx)"
        />
      </div>
      <div
        v-else
        class="border border-dashed border-zinc-200 rounded-lg p-3 text-center cursor-pointer hover:bg-zinc-50 transition-colors"
        @click="chartInput?.click()"
      >
        <div class="text-xs text-zinc-600 font-medium">📈 คลิกเพื่ออัปโหลดกราฟผลการทดลอง (ROC, Loss curve, Confusion Matrix)</div>
      </div>
    </div>

    <!-- Ablation Study & Error Analysis -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        การทดลองตัดส่วนประกอบและวิเคราะห์ข้อผิดพลาด (Ablation Study & Error Analysis)
      </label>
      <textarea
        v-model="step.data.ablation"
        rows="3"
        placeholder="บันทึกผลการตัดส่วนประกอบย่อยของโมเดล และวิเคราะห์ตัวอย่างเคสที่ทำนายผิดพลาด (Error Cases)..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Discussion & Key Findings -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        บทวิเคราะห์และการอภิปรายผล (Discussion & Key Findings)
      </label>
      <textarea
        v-model="step.data.discussion"
        rows="4"
        placeholder="อภิปรายข้อค้นพบสำคัญ ทำไมวิธีที่นำเสนอถึงได้ผลลัพธ์ที่ดีกว่า baseline และมีข้อจำกัดในสถานการณ์ใด..."
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
