<script setup lang="ts">
import { computed } from 'vue'
import type { ResearchFile } from '~/types/research'

const props = defineProps<{
  matrix: Record<string, Record<string, string>>
  notebookFiles: ResearchFile[]
}>()

const emit = defineEmits<{
  (e: 'open-file', fileId: string): void
}>()

// Helper to ensure row data exists
const getRow = (fileId: string) => {
  if (!props.matrix[fileId]) {
    props.matrix[fileId] = {
      year: '',
      problem: '',
      dataset: '',
      method: '',
      metrics_result: '',
      limitation_gap: ''
    }
  }
  return props.matrix[fileId]
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <span>📊 Literature Synthesis Matrix</span>
          <span class="text-xs font-normal text-zinc-500">ตารางสังเคราะห์เปรียบเทียบวรรณกรรม</span>
        </h3>
        <p class="text-[11px] text-zinc-500 mt-0.5">
          ดึงไฟล์เปเปอร์ทั้งหมดใน Notebook นี้มาสร้างเป็นตารางสรุปเปรียบเทียบ คลิกชื่อเปเปอร์เพื่อเปิดดู PDF ด้านข้างได้ทันที
        </p>
      </div>
      <div class="text-xs font-medium text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
        {{ notebookFiles.length }} เปเปอร์
      </div>
    </div>

    <div v-if="notebookFiles.length" class="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse min-w-[850px]">
          <thead class="bg-zinc-100/90 text-zinc-700 font-semibold border-b border-zinc-200">
            <tr>
              <th class="p-2.5 border-r border-zinc-200 w-44">ชื่อเปเปอร์ / ปี</th>
              <th class="p-2.5 border-r border-zinc-200 w-48">ปัญหาที่แก้</th>
              <th class="p-2.5 border-r border-zinc-200 w-40">Dataset ที่ใช้</th>
              <th class="p-2.5 border-r border-zinc-200 w-48">Method / Model</th>
              <th class="p-2.5 border-r border-zinc-200 w-48">Evaluate Metrics & ผลลัพธ์</th>
              <th class="p-2.5 w-48">ข้อจำกัด (Research Gap)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200/80">
            <tr
              v-for="file in notebookFiles"
              :key="file.id"
              class="hover:bg-zinc-50/70 transition-colors align-top"
            >
              <!-- Paper Name & Year -->
              <td class="p-2.5 border-r border-zinc-200 space-y-1.5 bg-zinc-50/40">
                <button
                  type="button"
                  class="font-semibold text-zinc-900 hover:text-blue-600 text-left line-clamp-2 leading-snug cursor-pointer group flex items-start gap-1"
                  title="คลิกเพื่อเปิดอ่านไฟล์นี้ใน PDF Viewer ด้านข้าง"
                  @click="emit('open-file', file.id)"
                >
                  <span class="text-zinc-400 group-hover:text-blue-600 text-xs">📄</span>
                  <span class="underline decoration-dotted group-hover:decoration-solid">{{ file.title }}</span>
                </button>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-zinc-400 font-medium">ปี:</span>
                  <input
                    v-model="getRow(file.id).year"
                    type="text"
                    placeholder="เช่น 2023"
                    class="w-16 px-1.5 py-0.5 text-[11px] border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  />
                </div>
              </td>

              <!-- Problem -->
              <td class="p-2 border-r border-zinc-200">
                <textarea
                  v-model="getRow(file.id).problem"
                  rows="3"
                  placeholder="ปัญหาสำคัญที่เปเปอร์นี้แก้ไข..."
                  class="w-full p-1.5 text-xs border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded bg-transparent focus:bg-white focus:outline-none resize-y"
                ></textarea>
              </td>

              <!-- Dataset -->
              <td class="p-2 border-r border-zinc-200">
                <textarea
                  v-model="getRow(file.id).dataset"
                  rows="3"
                  placeholder="ชุดข้อมูลที่ใช้ทดสอบ..."
                  class="w-full p-1.5 text-xs border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded bg-transparent focus:bg-white focus:outline-none resize-y"
                ></textarea>
              </td>

              <!-- Method -->
              <td class="p-2 border-r border-zinc-200">
                <textarea
                  v-model="getRow(file.id).method"
                  rows="3"
                  placeholder="โมเดล หรืออัลกอริทึมที่นำเสนอ..."
                  class="w-full p-1.5 text-xs border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded bg-transparent focus:bg-white focus:outline-none resize-y"
                ></textarea>
              </td>

              <!-- Metrics & Result -->
              <td class="p-2 border-r border-zinc-200">
                <textarea
                  v-model="getRow(file.id).metrics_result"
                  rows="3"
                  placeholder="ตัวชี้วัดและตัวเลขผลลัพธ์..."
                  class="w-full p-1.5 text-xs border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded bg-transparent focus:bg-white focus:outline-none resize-y font-mono"
                ></textarea>
              </td>

              <!-- Limitations / Gap -->
              <td class="p-2">
                <textarea
                  v-model="getRow(file.id).limitation_gap"
                  rows="3"
                  placeholder="ข้อจำกัดหรือสิ่งที่ยังทำไม่ได้..."
                  class="w-full p-1.5 text-xs border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded bg-transparent focus:bg-white focus:outline-none resize-y"
                ></textarea>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="text-center p-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
      <div class="text-3xl mb-1.5">📑</div>
      <div class="text-xs font-semibold text-zinc-700">ยังไม่มีเปเปอร์ใน Notebook นี้</div>
      <div class="text-[11px] text-zinc-400 mt-0.5">อัปโหลดไฟล์ PDF ใน Sidebar ซ้าย จากนั้นจะปรากฏในตาราง Matrix นี้โดยอัตโนมัติ</div>
    </div>
  </div>
</template>
