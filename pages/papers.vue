<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Download,
  GitBranch,
  Database,
  Calendar,
  Layers,
  Sparkles,
  Check
} from 'lucide-vue-next'
import { useResearchWorkflow } from '~/composables/useResearchWorkflow'
import type { PaperStatus } from '~/types/research'

const route = useRoute()
const { papers, stages, deletePaper, updatePaper } = useResearchWorkflow()

const isUploadModalOpen = ref(false)
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('all')
const selectedStageFilter = ref<string>('all')

onMounted(() => {
  if (route.query.new === '1') {
    isUploadModalOpen.value = true
  }
})

const filteredPapers = computed(() => {
  return papers.value.filter(paper => {
    const matchesSearch =
      paper.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      paper.authors.some(a => a.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesStatus =
      selectedStatusFilter.value === 'all' || paper.status === selectedStatusFilter.value

    const matchesStage =
      selectedStageFilter.value === 'all' || paper.stageId === selectedStageFilter.value

    return matchesSearch && matchesStatus && matchesStage
  })
})

const getStageName = (stageId: string) => {
  const stage = stages.value.find(s => s.id === stageId)
  return stage ? `ขั้นที่ ${stage.stepNumber}: ${stage.title}` : stageId
}

const confirmDelete = (paperId: string, title: string) => {
  if (confirm(`คุณต้องการลบเอกสาร "${title}" หรือไม่?`)) {
    deletePaper(paperId)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900">
          คลังเอกสารและบทความวิจัย (Research Papers & Artifacts)
        </h1>
        <p class="text-sm text-zinc-500">
          จัดการไฟล์เปเปอร์ ร่างบทความ บันทึกการทดลอง และเอกสารทางวิชาการที่เชื่อมโยงกับ Git และ Supabase
        </p>
      </div>

      <button
        @click="isUploadModalOpen = true"
        class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm self-start sm:self-auto"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>+ อัปโหลดงานวิจัยใหม่</span>
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
      <!-- Search Input -->
      <div class="relative flex-1 w-full">
        <Search class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาชื่อเปเปอร์, คำสำคัญ, บทคัดย่อ หรือชื่อผู้วิจัย..."
          class="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
        />
      </div>

      <!-- Status Filter -->
      <div class="flex items-center gap-2 w-full md:w-auto">
        <span class="text-xs text-zinc-500 whitespace-nowrap">สถานะ:</span>
        <select
          v-model="selectedStatusFilter"
          class="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 w-full md:w-auto"
        >
          <option value="all">ทั้งหมด (All Status)</option>
          <option value="draft">ฉบับร่าง (Draft)</option>
          <option value="revising">กำลังปรับแก้ (Revising)</option>
          <option value="in_review">รอการตรวจสอบ (In Review)</option>
          <option value="accepted">ตอบรับแล้ว (Accepted)</option>
          <option value="published">ตีพิมพ์แล้ว (Published)</option>
        </select>
      </div>

      <!-- Stage Filter -->
      <div class="flex items-center gap-2 w-full md:w-auto">
        <span class="text-xs text-zinc-500 whitespace-nowrap">ขั้นตอน:</span>
        <select
          v-model="selectedStageFilter"
          class="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 w-full md:w-auto"
        >
          <option value="all">ทุกขั้นตอน (All Stages)</option>
          <option v-for="s in stages" :key="s.id" :value="s.id">
            ขั้นที่ {{ s.stepNumber }}: {{ s.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Paper Cards Grid -->
    <div v-if="filteredPapers.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="paper in filteredPapers"
        :key="paper.id"
        class="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between space-y-4"
      >
        <div class="space-y-3">
          <!-- Top row tags -->
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <StatusBadge :status="paper.status" type="paper" />
              <span class="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                {{ paper.version }}
              </span>
            </div>
            
            <div class="flex items-center gap-2 text-xs text-zinc-400">
              <span class="font-mono flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200">
                <Database v-if="paper.storageType === 'supabase'" class="w-3 h-3 text-emerald-600" />
                <GitBranch v-else-if="paper.storageType === 'git'" class="w-3 h-3 text-zinc-700" />
                <FileText v-else class="w-3 h-3 text-zinc-400" />
                {{ paper.storageType }}
              </span>
            </div>
          </div>

          <!-- Title -->
          <h3 class="font-bold text-base text-zinc-900 leading-snug">
            {{ paper.title }}
          </h3>

          <!-- Authors & Stage Info -->
          <div class="space-y-1 text-xs text-zinc-500">
            <div><strong>ผู้วิจัย:</strong> {{ paper.authors.join(', ') }}</div>
            <div><strong>ขั้นตอนวิจัย:</strong> {{ getStageName(paper.stageId) }}</div>
          </div>

          <!-- Abstract excerpt -->
          <div class="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-600 leading-relaxed font-normal">
            {{ paper.abstract }}
          </div>

          <!-- Keywords tags -->
          <div v-if="paper.keywords && paper.keywords.length > 0" class="flex flex-wrap gap-1.5 pt-1">
            <span
              v-for="(kw, idx) in paper.keywords"
              :key="idx"
              class="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[11px]"
            >
              #{{ kw }}
            </span>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
          <div class="text-[11px] text-zinc-400">
            อัปเดต: {{ paper.updatedAt }}
          </div>

          <div class="flex items-center gap-2">
            <a
              v-if="paper.fileUrl"
              :href="paper.fileUrl"
              target="_blank"
              class="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-xs font-medium flex items-center gap-1 transition-colors"
              title="ดาวน์โหลดหรือเปิดไฟล์"
            >
              <Download class="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </a>

            <a
              v-if="paper.gitRepoUrl"
              :href="paper.gitRepoUrl"
              target="_blank"
              class="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-xs font-medium flex items-center gap-1 transition-colors"
              title="เปิด Git Repository"
            >
              <GitBranch class="w-3.5 h-3.5" />
              <span>Git</span>
            </a>

            <button
              @click="confirmDelete(paper.id, paper.title)"
              class="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-zinc-100 transition-colors"
              title="ลบเอกสาร"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 bg-white rounded-xl border border-zinc-200 space-y-3">
      <FileText class="w-10 h-10 text-zinc-300 mx-auto" />
      <h3 class="text-sm font-semibold text-zinc-700">ไม่พบบทความวิจัยที่ค้นหา</h3>
      <p class="text-xs text-zinc-400 max-w-sm mx-auto">
        ลองปรับเปลี่ยนคำค้นหา หรือคลิกปุ่มด้านล่างเพื่ออัปโหลดผลงานวิจัยเข้าสู่ระบบ
      </p>
      <button
        @click="isUploadModalOpen = true"
        class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>+ อัปโหลดบทความใหม่</span>
      </button>
    </div>

    <!-- Upload Modal -->
    <UploadPaperModal
      :is-open="isUploadModalOpen"
      @close="isUploadModalOpen = false"
    />
  </div>
</template>
