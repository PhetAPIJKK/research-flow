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
  Pin,
  Tag,
  Layers,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Calendar,
  User,
  CheckCircle2,
  Info
} from 'lucide-vue-next'
import { useResearchWorkflow } from '~/composables/useResearchWorkflow'
import type { ResearchPaper } from '~/types/research'

const route = useRoute()
const {
  papers,
  sortedPapers,
  stages,
  activePaperId,
  togglePin,
  deletePaper
} = useResearchWorkflow()

const isUploadModalOpen = ref(false)
const searchQuery = ref('')
const groupByMode = ref<'category' | 'stage' | 'flat'>('category')
const showOnlyPinned = ref(false)
const viewTab = ref<'pdf' | 'details'>('pdf')
const collapsedGroups = ref<Record<string, boolean>>({})

// Select paper from route query if available
onMounted(() => {
  if (route.query.id && typeof route.query.id === 'string') {
    activePaperId.value = route.query.id
  } else if (!activePaperId.value && sortedPapers.value.length > 0) {
    activePaperId.value = sortedPapers.value[0].id
  }

  if (route.query.new === '1') {
    isUploadModalOpen.value = true
  }
})

// Current selected paper
const currentPaper = computed(() => {
  return papers.value.find(p => p.id === activePaperId.value) || sortedPapers.value[0] || null
})

// Current paper's PDF URL or Data URL
const currentPdfUrl = computed(() => {
  if (!currentPaper.value) return null
  return currentPaper.value.fileData || currentPaper.value.fileUrl || null
})

// Filter papers based on search and pinned toggle
const filteredPapers = computed(() => {
  return sortedPapers.value.filter(paper => {
    const matchesSearch =
      paper.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (paper.fileName && paper.fileName.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (paper.category && paper.category.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      paper.authors.some(a => a.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesPinned = !showOnlyPinned.value || paper.isPinned

    return matchesSearch && matchesPinned
  })
})

// Grouped papers by Category or Stage
const groupedPapers = computed(() => {
  if (groupByMode.value === 'flat') {
    return [{ groupKey: 'all', title: 'ไฟล์ทั้งหมด (All Files)', items: filteredPapers.value }]
  }

  if (groupByMode.value === 'stage') {
    const map = new Map<string, ResearchPaper[]>()
    for (const stage of stages.value) {
      map.set(stage.id, [])
    }
    map.set('unassigned', [])

    for (const paper of filteredPapers.value) {
      const key = paper.stageId || 'unassigned'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(paper)
    }

    const groups: { groupKey: string; title: string; items: ResearchPaper[] }[] = []
    for (const stage of stages.value) {
      const items = map.get(stage.id) || []
      if (items.length > 0) {
        groups.push({
          groupKey: stage.id,
          title: `ขั้นที่ ${stage.stepNumber}: ${stage.title}`,
          items
        })
      }
    }
    const unassigned = map.get('unassigned') || []
    if (unassigned.length > 0) {
      groups.push({
        groupKey: 'unassigned',
        title: 'ขั้นตอนอื่นๆ',
        items: unassigned
      })
    }
    return groups
  }

  // Group by Category (default)
  const categoryMap = new Map<string, ResearchPaper[]>()
  for (const paper of filteredPapers.value) {
    const cat = paper.category || 'เอกสารทั่วไป (Uncategorized)'
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, [])
    }
    categoryMap.get(cat)!.push(paper)
  }

  const groups: { groupKey: string; title: string; items: ResearchPaper[] }[] = []
  for (const [catName, items] of categoryMap.entries()) {
    groups.push({
      groupKey: catName,
      title: catName,
      items
    })
  }
  return groups
})

const toggleGroupCollapse = (groupKey: string) => {
  collapsedGroups.value[groupKey] = !collapsedGroups.value[groupKey]
}

const getStageName = (stageId: string) => {
  const stage = stages.value.find(s => s.id === stageId)
  return stage ? `ขั้นที่ ${stage.stepNumber}: ${stage.title}` : stageId
}

const selectPaper = (paperId: string) => {
  activePaperId.value = paperId
}

const confirmDelete = (paperId: string, title: string) => {
  if (confirm(`คุณต้องการลบไฟล์ "${title}" หรือไม่?`)) {
    deletePaper(paperId)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Top Action & Search Bar -->
    <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <FileText class="w-5 h-5 text-zinc-800" />
          <span>คลังไฟล์ & เอกสารวิจัย (Research Files & PDF Viewer)</span>
        </h1>
        <p class="text-xs text-zinc-500">
          เปิดอ่านไฟล์ PDF ได้ทันทีบนเว็บ จัดกลุ่มหมวดหมู่ และปักหมุดเอกสารสำคัญ
        </p>
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto">
        <!-- Search Input -->
        <div class="relative flex-1 md:w-64">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อไฟล์, หมวดหมู่, ผู้วิจัย..."
            class="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 bg-zinc-50/50"
          />
        </div>

        <!-- Upload Button -->
        <button
          @click="isUploadModalOpen = true"
          class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>+ อัปโหลดไฟล์</span>
        </button>
      </div>
    </div>

    <!-- Main Split-Screen Container -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- LEFT PANE: All Uploaded Files List & Grouping (4 Cols) -->
      <div class="lg:col-span-4 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden max-h-[85vh] sticky top-20">
        <!-- Grouping Controls Header -->
        <div class="p-3 border-b border-zinc-100 bg-zinc-50/60 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              จัดกลุ่มไฟล์ (Group By)
            </span>
            <!-- Pinned only toggle -->
            <button
              @click="showOnlyPinned = !showOnlyPinned"
              class="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
              :class="showOnlyPinned 
                ? 'bg-amber-100 text-amber-900 font-semibold' 
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'"
              title="แสดงเฉพาะไฟล์ที่ปักหมุด"
            >
              <Pin class="w-3 h-3 rotate-45" :class="showOnlyPinned ? 'text-amber-700 fill-amber-700' : ''" />
              <span>ปักหมุด ({{ papers.filter(p => p.isPinned).length }})</span>
            </button>
          </div>

          <!-- Group Mode Buttons -->
          <div class="grid grid-cols-3 gap-1 p-0.5 bg-zinc-200/70 rounded-lg text-xs">
            <button
              @click="groupByMode = 'category'"
              class="py-1 rounded-md text-[11px] font-medium transition-all"
              :class="groupByMode === 'category' 
                ? 'bg-white text-zinc-900 shadow-xs' 
                : 'text-zinc-600 hover:text-zinc-900'"
            >
              หมวดหมู่
            </button>
            <button
              @click="groupByMode = 'stage'"
              class="py-1 rounded-md text-[11px] font-medium transition-all"
              :class="groupByMode === 'stage' 
                ? 'bg-white text-zinc-900 shadow-xs' 
                : 'text-zinc-600 hover:text-zinc-900'"
            >
              ขั้นตอนวิจัย
            </button>
            <button
              @click="groupByMode = 'flat'"
              class="py-1 rounded-md text-[11px] font-medium transition-all"
              :class="groupByMode === 'flat' 
                ? 'bg-white text-zinc-900 shadow-xs' 
                : 'text-zinc-600 hover:text-zinc-900'"
            >
              ทั้งหมด ({{ filteredPapers.length }})
            </button>
          </div>
        </div>

        <!-- Files Scrollable List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-4">
          <div
            v-for="group in groupedPapers"
            :key="group.groupKey"
            class="space-y-1.5"
          >
            <!-- Group Header (Accordion Toggle) -->
            <button
              @click="toggleGroupCollapse(group.groupKey)"
              class="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded transition-colors group"
            >
              <div class="flex items-center gap-1.5 truncate">
                <ChevronDown
                  class="w-3.5 h-3.5 text-zinc-400 transition-transform"
                  :class="{ '-rotate-90': collapsedGroups[group.groupKey] }"
                />
                <span class="truncate">{{ group.title }}</span>
              </div>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-500 font-mono">
                {{ group.items.length }}
              </span>
            </button>

            <!-- Group File Items -->
            <div
              v-show="!collapsedGroups[group.groupKey]"
              class="space-y-1 pl-1"
            >
              <div
                v-for="paper in group.items"
                :key="paper.id"
                @click="selectPaper(paper.id)"
                class="group/item relative p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5"
                :class="activePaperId === paper.id
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-800'"
              >
                <!-- Top Row: Pin, Version & Status -->
                <div class="flex items-center justify-between gap-1 text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <!-- Pin Toggle Button -->
                    <button
                      type="button"
                      @click.stop="togglePin(paper.id)"
                      class="p-0.5 rounded transition-transform"
                      :class="paper.isPinned
                        ? (activePaperId === paper.id ? 'text-amber-300' : 'text-amber-500')
                        : (activePaperId === paper.id ? 'text-zinc-400 hover:text-white' : 'text-zinc-300 hover:text-zinc-600')"
                      :title="paper.isPinned ? 'ถอดหมุด' : 'ปักหมุดไว้บนสุด'"
                    >
                      <Pin class="w-3.5 h-3.5 rotate-45" :class="{ 'fill-current': paper.isPinned }" />
                    </button>

                    <span
                      class="font-mono text-[10px] px-1.5 py-0.2 rounded"
                      :class="activePaperId === paper.id ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'"
                    >
                      {{ paper.version }}
                    </span>
                  </div>

                  <span
                    class="text-[10px] px-1.5 py-0.2 rounded-full border truncate"
                    :class="activePaperId === paper.id
                      ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-500'"
                  >
                    {{ paper.category }}
                  </span>
                </div>

                <!-- Title -->
                <h4
                  class="font-semibold text-xs leading-snug line-clamp-2"
                  :class="activePaperId === paper.id ? 'text-white' : 'text-zinc-900'"
                >
                  {{ paper.title }}
                </h4>

                <!-- Bottom Row: File Details & Size -->
                <div
                  class="flex items-center justify-between text-[10px] pt-0.5"
                  :class="activePaperId === paper.id ? 'text-zinc-400' : 'text-zinc-400'"
                >
                  <span class="flex items-center gap-1 truncate max-w-[170px]">
                    <FileText class="w-3 h-3 shrink-0" />
                    <span class="truncate">{{ paper.fileName || 'document.pdf' }}</span>
                  </span>

                  <span class="font-mono">{{ paper.fileSize || '2 MB' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty list state -->
          <div
            v-if="filteredPapers.length === 0"
            class="p-8 text-center text-xs text-zinc-400 space-y-2"
          >
            <p>ไม่พบไฟล์ที่ตรงกับเงื่อนไข</p>
            <button
              @click="isUploadModalOpen = true"
              class="text-zinc-900 underline font-medium"
            >
              คลิกเพื่ออัปโหลดไฟล์ใหม่
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT PANE: Full In-App PDF & Document Content Viewer (8 Cols) -->
      <div class="lg:col-span-8 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden min-h-[85vh]">
        <template v-if="currentPaper">
          <!-- Viewer Top Toolbar -->
          <div class="px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <!-- Left Info -->
            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Pin Toggle Pill -->
                <button
                  @click="togglePin(currentPaper.id)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors"
                  :class="currentPaper.isPinned
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'"
                >
                  <Pin class="w-3 h-3 rotate-45" :class="{ 'text-amber-600 fill-amber-600': currentPaper.isPinned }" />
                  <span>{{ currentPaper.isPinned ? 'ปักหมุดแล้ว' : 'ปักหมุดไฟล์นี้' }}</span>
                </button>

                <StatusBadge :status="currentPaper.status" type="paper" />
                <span class="text-xs font-mono text-zinc-500">{{ currentPaper.version }}</span>
                <span class="text-xs text-zinc-400">&bull;</span>
                <span class="text-xs text-zinc-600 font-medium">{{ currentPaper.category }}</span>
              </div>

              <h2 class="text-base font-bold text-zinc-900 truncate" :title="currentPaper.title">
                {{ currentPaper.title }}
              </h2>
            </div>

            <!-- Right Actions & Tab Switcher -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- View Mode Tabs -->
              <div class="flex items-center p-0.5 bg-zinc-200/80 rounded-lg text-xs">
                <button
                  @click="viewTab = 'pdf'"
                  class="px-2.5 py-1 rounded-md font-medium transition-all"
                  :class="viewTab === 'pdf' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'"
                >
                  เปิดอ่าน PDF
                </button>
                <button
                  @click="viewTab = 'details'"
                  class="px-2.5 py-1 rounded-md font-medium transition-all"
                  :class="viewTab === 'details' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'"
                >
                  ข้อมูลบทความ
                </button>
              </div>

              <!-- Open in New Tab -->
              <a
                v-if="currentPdfUrl"
                :href="currentPdfUrl"
                target="_blank"
                class="p-1.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                title="เปิดในแท็บใหม่"
              >
                <ExternalLink class="w-4 h-4" />
              </a>

              <!-- Download Button -->
              <a
                v-if="currentPdfUrl"
                :href="currentPdfUrl"
                :download="currentPaper.fileName || 'paper.pdf'"
                class="p-1.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                title="ดาวน์โหลดไฟล์"
              >
                <Download class="w-4 h-4" />
              </a>

              <!-- Delete Button -->
              <button
                @click="confirmDelete(currentPaper.id, currentPaper.title)"
                class="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="ลบไฟล์นี้"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Document Sub-Header Bar (File Metadata) -->
          <div class="px-5 py-2 border-b border-zinc-100 bg-white text-xs text-zinc-500 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-4">
              <span><strong>ผู้วิจัย:</strong> {{ currentPaper.authors.join(', ') }}</span>
              <span>&bull;</span>
              <span><strong>ขั้นตอน:</strong> {{ getStageName(currentPaper.stageId) }}</span>
            </div>
            <div class="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
              <span v-if="currentPaper.fileName">{{ currentPaper.fileName }}</span>
              <span v-if="currentPaper.fileSize">({{ currentPaper.fileSize }})</span>
              <span>{{ currentPaper.uploadedAt }}</span>
            </div>
          </div>

          <!-- TAB 1: In-App Embedded PDF Viewer -->
          <div v-show="viewTab === 'pdf'" class="flex-1 w-full bg-zinc-100 flex flex-col min-h-[680px]">
            <iframe
              v-if="currentPdfUrl"
              :src="currentPdfUrl"
              class="w-full flex-1 border-0 min-h-[680px] bg-white"
              title="PDF Document Preview"
            ></iframe>

            <!-- Fallback if no file URL -->
            <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-400 space-y-3">
              <FileText class="w-12 h-12 text-zinc-300 stroke-1" />
              <div class="text-sm font-semibold text-zinc-700">ไม่มีไฟล์ PDF แนบกับบทความนี้</div>
              <p class="text-xs text-zinc-500 max-w-sm">
                บทความนี้ถูกบันทึกในรูปแบบข้อมูลเมตาดาต้า หรือยังไม่ได้อัปโหลดไฟล์ สามารถคลิกด้านล่างเพื่ออัปโหลดไฟล์ PDF ได้
              </p>
              <button
                @click="isUploadModalOpen = true"
                class="px-3.5 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800"
              >
                อัปโหลดไฟล์ PDF
              </button>
            </div>
          </div>

          <!-- TAB 2: Document Details & Abstract View -->
          <div v-show="viewTab === 'details'" class="p-6 space-y-6 overflow-y-auto">
            <!-- Abstract -->
            <div class="space-y-2">
              <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                บทคัดย่อ (Abstract)
              </h3>
              <p class="text-sm text-zinc-800 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                {{ currentPaper.abstract }}
              </p>
            </div>

            <!-- Keywords -->
            <div v-if="currentPaper.keywords && currentPaper.keywords.length > 0" class="space-y-2">
              <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                คำสำคัญ (Keywords)
              </h3>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="(kw, idx) in currentPaper.keywords"
                  :key="idx"
                  class="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium"
                >
                  #{{ kw }}
                </span>
              </div>
            </div>

            <!-- Git / Storage Metadata -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div class="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <GitBranch class="w-4 h-4 text-zinc-600" />
                  <span>การเชื่อมโยง Git Repository</span>
                </div>
                <div class="text-xs text-zinc-600 space-y-1">
                  <div>Repo: <span class="font-mono text-zinc-800">{{ currentPaper.gitRepoUrl || '-' }}</span></div>
                  <div>Branch: <span class="font-mono text-zinc-800">{{ currentPaper.gitBranch || 'main' }}</span></div>
                  <div>Commit: <span class="font-mono text-zinc-800">{{ currentPaper.gitCommitHash || '-' }}</span></div>
                </div>
              </div>

              <div class="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div class="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Database class="w-4 h-4 text-emerald-600" />
                  <span>การจัดเก็บไฟล์ (Storage Provider)</span>
                </div>
                <div class="text-xs text-zinc-600 space-y-1">
                  <div>Provider: <span class="font-semibold text-zinc-800 capitalize">{{ currentPaper.storageType }}</span></div>
                  <div>ขนาดไฟล์: <span class="text-zinc-800">{{ currentPaper.fileSize || 'N/A' }}</span></div>
                  <div>บันทึกล่าสุด: <span class="text-zinc-800">{{ currentPaper.updatedAt }}</span></div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="currentPaper.notes" class="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-amber-900 space-y-1">
              <div class="font-semibold">บันทึกเพิ่มเติม (Notes):</div>
              <p>{{ currentPaper.notes }}</p>
            </div>
          </div>
        </template>

        <!-- Empty State (No paper selected) -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-400 space-y-3">
          <FileText class="w-12 h-12 text-zinc-300 stroke-1" />
          <div class="text-base font-semibold text-zinc-700">เลือกไฟล์จากฝั่งซ้ายเพื่อเปิดอ่านในเว็บ</div>
          <p class="text-xs text-zinc-500 max-w-sm">
            เลือกไฟล์งานวิจัยที่ต้องการ หรือคลิก "+ อัปโหลดไฟล์" เพื่อเพิ่มไฟล์ PDF เข้าสู่ระบบ
          </p>
          <button
            @click="isUploadModalOpen = true"
            class="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
          >
            + อัปโหลดไฟล์งานวิจัย
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <UploadPaperModal
      :is-open="isUploadModalOpen"
      @close="isUploadModalOpen = false"
    />
  </div>
</template>
