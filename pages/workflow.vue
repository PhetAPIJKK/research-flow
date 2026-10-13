<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FileCheck,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Upload,
  ArrowRight
} from 'lucide-vue-next'
import { useResearchWorkflow } from '~/composables/useResearchWorkflow'
import type { StageStatus } from '~/types/research'

const route = useRoute()
const {
  stages,
  papers,
  activeStageId,
  getStageProgress,
  toggleChecklistItem,
  setStageStatus
} = useResearchWorkflow()

const isUploadModalOpen = ref(false)
const newChecklistLabel = ref('')

// Check if query param specified a stage
onMounted(() => {
  if (route.query.stage && typeof route.query.stage === 'string') {
    activeStageId.value = route.query.stage
  }
})

const currentStage = computed(() => {
  return stages.value.find(s => s.id === activeStageId.value) || stages.value[0]
})

const currentStagePapers = computed(() => {
  return papers.value.filter(p => p.stageId === currentStage.value.id)
})

const addChecklistItem = () => {
  if (!newChecklistLabel.value.trim()) return
  currentStage.value.checklist.push({
    id: `custom-${Date.now()}`,
    label: newChecklistLabel.value.trim(),
    completed: false
  })
  newChecklistLabel.value = ''
}

const removeChecklistItem = (itemId: string) => {
  currentStage.value.checklist = currentStage.value.checklist.filter(c => c.id !== itemId)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Title -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900">
          ขั้นตอนและกระบวนการทำวิจัย (Research Workflow Pipeline)
        </h1>
        <p class="text-sm text-zinc-500">
          ติดตามและทำเครื่องหมายสิ่งที่ต้องทำในแต่ละขั้นตอน พร้อมรวบรวมหลักฐานและเอกสารผลงานวิจัย
        </p>
      </div>

      <button
        @click="isUploadModalOpen = true"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm self-start sm:self-auto"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>อัปโหลดงานวิจัยสำหรับขั้นตอนนี้</span>
      </button>
    </div>

    <!-- Main 2-Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Stage Selector Navigation (4 Cols) -->
      <div class="lg:col-span-4 bg-white rounded-xl border border-zinc-200 p-3 space-y-1 shadow-sm">
        <div class="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          ลำดับขั้นตอน (7 Stages)
        </div>

        <button
          v-for="stage in stages"
          :key="stage.id"
          @click="activeStageId = stage.id"
          class="w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 group"
          :class="activeStageId === stage.id
            ? 'bg-zinc-100/90 text-zinc-900 font-semibold ring-1 ring-zinc-300'
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'"
        >
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
            :class="stage.status === 'completed'
              ? 'bg-emerald-100 text-emerald-800 font-bold'
              : stage.status === 'in_progress'
              ? 'bg-blue-100 text-blue-800 font-bold'
              : 'bg-zinc-200 text-zinc-600 font-medium'"
          >
            {{ stage.stepNumber }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="text-xs font-medium leading-tight truncate">
              {{ stage.title }}
            </div>
            <div class="text-[11px] text-zinc-400 truncate mt-0.5">
              {{ stage.titleEn }}
            </div>

            <!-- Mini progress line -->
            <div class="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
              <span>{{ stage.checklist.filter(c => c.completed).length }}/{{ stage.checklist.length }} เช็คลิสต์</span>
              <span>{{ getStageProgress(stage) }}%</span>
            </div>
            <div class="w-full bg-zinc-200/60 rounded-full h-1 mt-1 overflow-hidden">
              <div
                class="bg-zinc-700 h-1 rounded-full"
                :style="{ width: `${getStageProgress(stage)}%` }"
              ></div>
            </div>
          </div>
        </button>
      </div>

      <!-- Right Column: Active Stage Details & Checklist (8 Cols) -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Stage Main Card -->
        <div class="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
          <!-- Stage Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-white">
                  STAGE 0{{ currentStage.stepNumber }}
                </span>
                <span class="text-xs text-zinc-400 font-mono">{{ currentStage.titleEn }}</span>
              </div>
              <h2 class="text-xl font-bold text-zinc-900 mt-1">
                {{ currentStage.title }}
              </h2>
            </div>

            <!-- Status Dropdown Selector -->
            <div class="flex items-center gap-2">
              <label class="text-xs text-zinc-500 font-medium">สถานะ:</label>
              <select
                :value="currentStage.status"
                @change="(e) => setStageStatus(currentStage.id, (e.target as HTMLSelectElement).value as StageStatus)"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="not_started">ยังไม่เริ่ม (Not Started)</option>
                <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                <option value="under_review">รอตรวจทาน (Under Review)</option>
                <option value="completed">เสร็จสิ้น (Completed)</option>
              </select>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              คำอธิบายขั้นตอนและเป้าหมาย
            </h3>
            <p class="text-sm text-zinc-700 leading-relaxed font-normal">
              {{ currentStage.fullDesc }}
            </p>
          </div>

          <!-- Interactive Checklist -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                รายการสิ่งที่ต้องทำ (Checklist & Requirements)
              </h3>
              <span class="text-xs text-zinc-500 font-medium">
                เสร็จแล้ว {{ currentStage.checklist.filter(c => c.completed).length }} จาก {{ currentStage.checklist.length }} รายการ ({{ getStageProgress(currentStage) }}%)
              </span>
            </div>

            <div class="space-y-2">
              <div
                v-for="item in currentStage.checklist"
                :key="item.id"
                @click="toggleChecklistItem(currentStage.id, item.id)"
                class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group"
                :class="item.completed
                  ? 'bg-zinc-50 border-zinc-200 text-zinc-400'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-800'"
              >
                <div class="flex items-center gap-3">
                  <div class="shrink-0 text-zinc-400 group-hover:text-zinc-600">
                    <CheckCircle2 v-if="item.completed" class="w-4 h-4 text-emerald-600" />
                    <Circle v-else class="w-4 h-4 text-zinc-300" />
                  </div>
                  <span
                    class="text-xs sm:text-sm font-normal"
                    :class="item.completed ? 'line-through text-zinc-400' : 'text-zinc-800'"
                  >
                    {{ item.label }}
                  </span>
                </div>

                <button
                  type="button"
                  @click.stop="removeChecklistItem(item.id)"
                  class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 transition-opacity"
                  title="ลบรายการ"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Add Checklist Item Input -->
            <form @submit.prevent="addChecklistItem" class="flex gap-2 pt-2">
              <input
                v-model="newChecklistLabel"
                type="text"
                placeholder="เพิ่มรายการเช็คลิสต์ใหม่..."
                class="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-800"
              />
              <button
                type="submit"
                class="px-3 py-1.5 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>เพิ่ม</span>
              </button>
            </form>
          </div>

          <!-- Deliverables & Tips Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
            <!-- Deliverables -->
            <div class="p-4 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-2">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                <FileCheck class="w-4 h-4 text-zinc-600" />
                <span>ผลลัพธ์ที่ต้องส่งมอบ (Deliverables)</span>
              </div>
              <ul class="space-y-1.5 text-xs text-zinc-600 pl-4 list-disc">
                <li v-for="(deliv, i) in currentStage.deliverables" :key="i">
                  {{ deliv }}
                </li>
              </ul>
            </div>

            <!-- Tips -->
            <div class="p-4 rounded-lg bg-amber-50/50 border border-amber-200/60 space-y-2">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <Lightbulb class="w-4 h-4 text-amber-600" />
                <span>คำแนะนำจากที่ปรึกษา (Advisor Tips)</span>
              </div>
              <ul class="space-y-1.5 text-xs text-amber-900/80 pl-4 list-disc">
                <li v-for="(tip, i) in currentStage.tips" :key="i">
                  {{ tip }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Papers Attached to This Stage -->
        <div class="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-zinc-900">เอกสารวิจัยในขั้นตอนนี้ (Papers in this stage)</h3>
              <p class="text-xs text-zinc-500">เอกสารหรือโค้ดที่อัปโหลดผูกกับขั้นตอนที่ {{ currentStage.stepNumber }}</p>
            </div>
            <button
              @click="isUploadModalOpen = true"
              class="text-xs font-medium text-zinc-900 hover:underline flex items-center gap-1"
            >
              + แนบเอกสารเพิ่ม
            </button>
          </div>

          <div v-if="currentStagePapers.length > 0" class="space-y-3">
            <div
              v-for="paper in currentStagePapers"
              :key="paper.id"
              class="p-4 rounded-lg border border-zinc-200 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div class="flex items-center gap-2">
                  <StatusBadge :status="paper.status" type="paper" />
                  <span class="font-mono text-[11px] text-zinc-400">{{ paper.version }}</span>
                </div>
                <div class="font-semibold text-sm text-zinc-900 mt-1">{{ paper.title }}</div>
                <div class="text-xs text-zinc-500 mt-0.5">
                  ไฟล์: {{ paper.fileName || 'ไม่มีไฟล์แนบ' }} &bull; จัดเก็บผ่าน {{ paper.storageType }}
                </div>
              </div>

              <NuxtLink
                :to="`/papers?id=${paper.id}`"
                class="px-3 py-1.5 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100 transition-colors self-start sm:self-auto flex items-center gap-1"
              >
                <span>รายละเอียด</span>
                <ArrowRight class="w-3 h-3" />
              </NuxtLink>
            </div>
          </div>

          <div v-else class="text-center py-6 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
            ยังไม่มีเอกสารแนบในขั้นตอนนี้ คลิก "อัปโหลดงานวิจัยสำหรับขั้นตอนนี้" ด้านบนเพื่อเริ่มแนบไฟล์
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Paper Modal -->
    <UploadPaperModal
      :is-open="isUploadModalOpen"
      :default-stage-id="activeStageId"
      @close="isUploadModalOpen = false"
    />
  </div>
</template>
