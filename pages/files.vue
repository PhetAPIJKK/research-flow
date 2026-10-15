<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { ResearchFile } from '~/types/research'
import { STEPS, STATUS_OPTIONS, type StepStatus } from '~/composables/useWorkflow'
import { useFiles, formatSize, formatDate, FALLBACK_CATEGORY } from '~/composables/useFiles'

const route = useRoute()
const {
  files, sortedFiles, notebooks, activeNotebookId, activeNotebook, setActive,
  notebookName, categoriesOf, categoryFileCount,
  addCategory, renameCategory, deleteCategory,
  addFile, getBlob, togglePin, moveFile, moveFileToNotebook, removeFile
} = useFiles()

const { wf, saveStatus, overallProgress, downloadMarkdown, loadWorkflow } = useWorkflow()
const supabase = useSupabaseSync()

const NEW_CATEGORY = '__new__'
const ALL = '__all__'
const FALLBACK = FALLBACK_CATEGORY

// ---------------- UI State & Selection ----------------
const selectedId = ref<string | null>(null)
const activeStep = ref<string>('problem')
const centerView = ref<'pdf' | 'matrix'>('pdf')
const showQuickNote = ref(true)
const search = ref('')
const groupMode = ref<'group' | 'none'>('group')
const pinnedOnly = ref(false)
const collapsedGroups = ref<Record<string, boolean>>({})

// Layout & Resizing
const sidebarCollapsed = ref(false)
const centerMaximized = ref(false)
const rightMaximized = ref(false)
const mobileTab = ref<'sidebar' | 'pdf' | 'workflow'>('workflow')

const leftWidth = ref(20)
const centerWidth = ref(43)
const rightWidth = ref(37)
const workspaceRef = ref<HTMLElement | null>(null)

// Viewer
const viewUrl = ref<string | null>(null)
const viewLoading = ref(false)

// Upload Modal / Slide-over
const showUploadModal = ref(false)
const pendingFile = ref<File | null>(null)
const uploadSaving = ref(false)
const uploadError = ref('')
const uploadForm = ref({
  title: '',
  notebookId: '',
  category: FALLBACK_CATEGORY,
  newCategory: '',
  pinned: false
})
const fileInput = ref<HTMLInputElement | null>(null)
const draggingSidebar = ref(false)

// Category Manager
const showCategoryManager = ref(false)
const newCatName = ref('')
const catError = ref('')
const editingCat = ref<string | null>(null)
const editCatName = ref('')

// ---------------- Computed Data ----------------
const current = computed(() => files.value.find(f => f.id === selectedId.value) || null)
const isPdf = computed(() => current.value?.type === 'application/pdf' || current.value?.fileName.toLowerCase().endsWith('.pdf'))

// Scoped files for the current notebook
const scopedFiles = computed(() =>
  activeNotebookId.value ? sortedFiles.value.filter(f => f.notebookId === activeNotebookId.value) : sortedFiles.value
)

const filteredFiles = computed(() => {
  const q = search.value.trim().toLowerCase()
  return scopedFiles.value.filter(f => {
    if (pinnedOnly.value && !f.pinned) return false
    if (!q) return true
    return (
      f.title.toLowerCase().includes(q) ||
      f.fileName.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      notebookName(f.notebookId).toLowerCase().includes(q)
    )
  })
})

const fileGroups = computed(() => {
  if (groupMode.value === 'none') {
    return [{ key: 'all', name: 'ไฟล์ทั้งหมด', items: filteredFiles.value }]
  }
  if (activeNotebook.value) {
    const nb = activeNotebook.value
    return nb.categories
      .map(c => ({ key: `c:${c}`, name: c, items: filteredFiles.value.filter(f => f.category === c) }))
      .filter(g => g.items.length)
  }
  return notebooks.value
    .map(nb => ({ key: `n:${nb.id}`, name: `📓 ${nb.name}`, items: filteredFiles.value.filter(f => f.notebookId === nb.id) }))
    .filter(g => g.items.length)
})

// Current notebook workflow data
const curWf = computed(() => (activeNotebookId.value ? wf(activeNotebookId.value) : undefined))

// Current active step object
const currentStepObj = computed(() => {
  if (!curWf.value || !activeStep.value) return null
  return curWf.value.steps[activeStep.value] || null
})

// ---------------- PDF Object URL Management ----------------
const revokeUrl = () => {
  if (viewUrl.value) URL.revokeObjectURL(viewUrl.value)
  viewUrl.value = null
}

watch(selectedId, async (id) => {
  revokeUrl()
  if (!id) return
  if (curWf.value) {
    curWf.value.ui.fileId = id
  }
  viewLoading.value = true
  try {
    const blob = await getBlob(id)
    if (blob && selectedId.value === id) {
      viewUrl.value = URL.createObjectURL(blob)
    }
  } finally {
    viewLoading.value = false
  }
})

// ---------------- State Persistence & Initialization ----------------
const initNotebookState = (nbId: string | null) => {
  if (!nbId) return
  loadWorkflow(nbId)
  const state = wf(nbId)
  if (state) {
    if (state.ui.step) activeStep.value = state.ui.step
    if (state.ui.fileId && scopedFiles.value.some(f => f.id === state.ui.fileId)) {
      selectedId.value = state.ui.fileId
    } else if (!scopedFiles.value.some(f => f.id === selectedId.value)) {
      selectedId.value = scopedFiles.value[0]?.id || null
    }
  }
}

watch(activeNotebookId, (newNbId) => {
  showCategoryManager.value = false
  editingCat.value = null
  initNotebookState(newNbId)
  if (!scopedFiles.value.some(f => f.id === selectedId.value)) {
    selectedId.value = scopedFiles.value[0]?.id || null
  }
})

watch(activeStep, (stepKey) => {
  if (curWf.value) {
    curWf.value.ui.step = stepKey
  }
})

watch(() => files.value.length, () => {
  const q = route.query.id
  const target = typeof q === 'string' ? files.value.find(f => f.id === q) : null
  if (target && !selectedId.value) {
    selectedId.value = target.id
    setActive(target.notebookId)
  } else if (!selectedId.value && scopedFiles.value.length) {
    selectedId.value = scopedFiles.value[0]?.id || null
  }
}, { immediate: true })

onMounted(() => {
  if (activeNotebookId.value) {
    initNotebookState(activeNotebookId.value)
  }
})

onBeforeUnmount(revokeUrl)

// ---------------- Split-Pane Resizing Handlers ----------------
let isDragging1 = false
let isDragging2 = false

const startDrag1 = (e: MouseEvent) => {
  e.preventDefault()
  isDragging1 = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const startDrag2 = (e: MouseEvent) => {
  e.preventDefault()
  isDragging2 = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const onDrag = (e: MouseEvent) => {
  if (!workspaceRef.value) return
  const rect = workspaceRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const totalW = rect.width
  if (totalW <= 0) return

  if (isDragging1) {
    const newL = Math.max(14, Math.min(32, (mouseX / totalW) * 100))
    const diff = newL - leftWidth.value
    if (centerWidth.value - diff >= 20) {
      leftWidth.value = Math.round(newL)
      centerWidth.value = Math.round(centerWidth.value - diff)
    }
  } else if (isDragging2) {
    const leftPx = (leftWidth.value / 100) * totalW
    const newCenterPx = mouseX - leftPx
    const newCenterPct = Math.max(22, Math.min(60, (newCenterPx / totalW) * 100))
    const newRightPct = 100 - leftWidth.value - newCenterPct
    if (newRightPct >= 20) {
      centerWidth.value = Math.round(newCenterPct)
      rightWidth.value = Math.round(newRightPct)
    }
  }
}

const stopDrag = () => {
  isDragging1 = false
  isDragging2 = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ---------------- File Actions ----------------
const openFileInCenter = (fileId: string) => {
  selectedId.value = fileId
  mobileTab.value = 'pdf'
}

const triggerUpload = () => {
  uploadForm.value = {
    title: '',
    notebookId: activeNotebookId.value || notebooks.value[0]?.id || '',
    category: categoriesOf(activeNotebookId.value || notebooks.value[0]?.id || '')[0] || FALLBACK_CATEGORY,
    newCategory: '',
    pinned: false
  }
  pendingFile.value = null
  uploadError.value = ''
  showUploadModal.value = true
}

const onFilePick = (file: File | undefined | null) => {
  if (!file) return
  pendingFile.value = file
  uploadForm.value.title = file.name.replace(/\.[^/.]+$/, '')
  uploadError.value = ''
}

const onDropFile = (e: DragEvent) => {
  draggingSidebar.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    triggerUpload()
    onFilePick(file)
  }
}

const handleSaveUpload = async () => {
  if (!pendingFile.value) {
    uploadError.value = 'กรุณาเลือกไฟล์'
    return
  }
  if (!uploadForm.value.notebookId) {
    uploadError.value = 'กรุณาเลือก Notebook'
    return
  }
  const isNew = uploadForm.value.category === NEW_CATEGORY
  const category = isNew ? uploadForm.value.newCategory.trim() : uploadForm.value.category
  if (!category) {
    uploadError.value = 'กรุณาระบุชื่อหมวดหมู่'
    return
  }
  if (isNew) addCategory(uploadForm.value.notebookId, category)

  uploadSaving.value = true
  uploadError.value = ''
  try {
    const remoteUrl = (await supabase.uploadFile(pendingFile.value)) || undefined
    const entry = await addFile(pendingFile.value, {
      notebookId: uploadForm.value.notebookId,
      title: uploadForm.value.title,
      category,
      pinned: uploadForm.value.pinned,
      remoteUrl
    })
    if (activeNotebookId.value && activeNotebookId.value !== entry.notebookId) {
      setActive(entry.notebookId)
    }
    selectedId.value = entry.id
    showUploadModal.value = false
    pendingFile.value = null
  } catch (err: any) {
    uploadError.value = 'บันทึกไฟล์ไม่สำเร็จ: ' + (err?.message || err)
  } finally {
    uploadSaving.value = false
  }
}

const handleDeleteFile = async () => {
  if (!current.value) return
  if (!confirm(`ลบไฟล์ "${current.value.title}" ?`)) return
  const id = current.value.id
  await removeFile(id)
  selectedId.value = scopedFiles.value.find(f => f.id !== id)?.id || null
}

// ---------------- Category Management ----------------
const handleAddCategory = () => {
  if (!activeNotebook.value) return
  catError.value = addCategory(activeNotebook.value.id, newCatName.value) || ''
  if (!catError.value) newCatName.value = ''
}

const startEditCategory = (cat: string) => {
  editingCat.value = cat
  editCatName.value = cat
  catError.value = ''
}

const saveEditCategory = () => {
  if (!editingCat.value || !activeNotebook.value) return
  catError.value = renameCategory(activeNotebook.value.id, editingCat.value, editCatName.value) || ''
  if (!catError.value) editingCat.value = null
}

const handleDeleteCategory = (cat: string) => {
  if (!activeNotebook.value) return
  const nbId = activeNotebook.value.id
  const count = categoryFileCount(nbId, cat)
  const msg = count
    ? `ลบหมวดหมู่ "${cat}" ? มี ${count} ไฟล์จะถูกย้ายไป "${FALLBACK}"`
    : `ลบหมวดหมู่ "${cat}" ?`
  if (!confirm(msg)) return
  catError.value = deleteCategory(nbId, cat) || ''
}

// ---------------- Export Markdown ----------------
const handleExportMarkdown = () => {
  if (!activeNotebookId.value) return
  const nb = activeNotebook.value
  const nbName = nb ? nb.name : 'Research_Flow'
  downloadMarkdown(activeNotebookId.value, nbName, (id: string) => {
    const f = files.value.find(x => x.id === id)
    return f ? f.title : id
  })
}

// Helper for status badge styling
const getStatusBadge = (status: StepStatus | string) => {
  switch (status) {
    case 'completed':
      return { label: 'เสร็จสิ้น', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' }
    case 'in_progress':
      return { label: 'กำลังทำ', bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' }
    case 'under_review':
      return { label: 'รอตรวจ/แก้', bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' }
    default:
      return { label: 'ยังไม่เริ่ม', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' }
  }
}
</script>

<template>
  <div class="h-[calc(100vh-3.75rem)] flex flex-col overflow-hidden bg-white rounded-xl border border-zinc-200/90 shadow-sm">
    <!-- Mobile Tab Switcher (Visible only on < lg) -->
    <div class="lg:hidden flex items-center justify-around border-b border-zinc-200 bg-zinc-50 p-1 text-xs">
      <button
        type="button"
        class="flex-1 py-1.5 font-medium rounded-md text-center transition-colors"
        :class="mobileTab === 'sidebar' ? 'bg-white shadow text-zinc-900' : 'text-zinc-600'"
        @click="mobileTab = 'sidebar'"
      >
        📁 ไฟล์ ({{ scopedFiles.length }})
      </button>
      <button
        type="button"
        class="flex-1 py-1.5 font-medium rounded-md text-center transition-colors"
        :class="mobileTab === 'pdf' ? 'bg-white shadow text-zinc-900' : 'text-zinc-600'"
        @click="mobileTab = 'pdf'"
      >
        📄 PDF Viewer
      </button>
      <button
        type="button"
        class="flex-1 py-1.5 font-medium rounded-md text-center transition-colors"
        :class="mobileTab === 'workflow' ? 'bg-white shadow text-zinc-900' : 'text-zinc-600'"
        @click="mobileTab = 'workflow'"
      >
        📝 Research Steps
      </button>
    </div>

    <!-- Main 3-Pane Container -->
    <div ref="workspaceRef" class="flex-1 flex overflow-hidden relative">
      <!-- ========================================================= -->
      <!-- PANE 1: LEFT SIDEBAR (~18% - 20%)                          -->
      <!-- ========================================================= -->
      <aside
        class="h-full flex flex-col bg-zinc-50/70 border-r border-zinc-200 transition-all select-none overflow-hidden"
        :class="[
          mobileTab !== 'sidebar' ? 'hidden lg:flex' : 'flex w-full',
          sidebarCollapsed ? 'lg:w-11 lg:min-w-[44px]' : ''
        ]"
        :style="!sidebarCollapsed ? { width: leftWidth + '%' } : {}"
        @dragover.prevent="draggingSidebar = true"
        @dragleave.prevent="draggingSidebar = false"
        @drop.prevent="onDropFile"
      >
        <!-- Collapsed Sidebar Icon Bar -->
        <div v-if="sidebarCollapsed" class="hidden lg:flex flex-col items-center py-3 gap-4 h-full">
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-zinc-200 text-zinc-700"
            title="ขยาย Sidebar"
            @click="sidebarCollapsed = false"
          >
            ▶
          </button>
          <div class="h-px w-6 bg-zinc-200"></div>
          <button
            type="button"
            class="p-2 rounded-lg bg-zinc-900 text-white shadow text-xs"
            title="อัปโหลดไฟล์"
            @click="triggerUpload"
          >
            +
          </button>
          <div class="flex-1"></div>
          <span class="text-[10px] text-zinc-400 rotate-90 origin-bottom whitespace-nowrap mb-8">
            {{ activeNotebook ? activeNotebook.name : 'คลังไฟล์' }}
          </span>
        </div>

        <!-- Expanded Sidebar -->
        <div v-else class="flex flex-col h-full min-w-[240px]">
          <!-- Header: Notebook switcher & upload -->
          <div class="p-3 border-b border-zinc-200 space-y-2 bg-white/60">
            <div class="flex items-center justify-between gap-1.5">
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <span class="text-base">📓</span>
                <select
                  :value="activeNotebookId ?? ALL"
                  class="flex-1 min-w-0 text-xs font-semibold px-2 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800 cursor-pointer"
                  @change="setActive(($event.target as HTMLSelectElement).value === ALL ? null : ($event.target as HTMLSelectElement).value)"
                >
                  <option :value="ALL">📚 ทุก Notebook</option>
                  <option v-for="nb in notebooks" :key="nb.id" :value="nb.id">
                    {{ nb.name }}
                  </option>
                </select>
              </div>
              <button
                type="button"
                class="hidden lg:block p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded"
                title="พับ Sidebar เก็บ"
                @click="sidebarCollapsed = true"
              >
                ◀
              </button>
            </div>

            <!-- Upload button & Search -->
            <div class="space-y-1.5">
              <button
                type="button"
                class="w-full py-1.5 px-3 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                @click="triggerUpload"
              >
                <span>+ อัปโหลดไฟล์</span>
                <span class="text-[10px] text-zinc-400 font-normal">(.pdf, .docx, .tex)</span>
              </button>

              <div class="relative">
                <input
                  v-model="search"
                  type="text"
                  placeholder="ค้นหาชื่อไฟล์ หรือหมวดหมู่..."
                  class="w-full pl-7 pr-2.5 py-1 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
                <span class="absolute left-2.5 top-1.5 text-zinc-400 text-xs">🔍</span>
                <button
                  v-if="search"
                  type="button"
                  class="absolute right-2 top-1 text-xs text-zinc-400 hover:text-zinc-600"
                  @click="search = ''"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Filter tabs -->
            <div class="flex items-center justify-between pt-1">
              <div class="flex p-0.5 bg-zinc-200/70 rounded-md text-[11px]">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded transition-all"
                  :class="groupMode === 'group' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-600'"
                  @click="groupMode = 'group'"
                >
                  จัดกลุ่ม
                </button>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded transition-all"
                  :class="groupMode === 'none' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-600'"
                  @click="groupMode = 'none'"
                >
                  ทั้งหมด
                </button>
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="text-[11px] px-1.5 py-0.5 rounded border transition-colors"
                  :class="pinnedOnly ? 'border-amber-300 bg-amber-50 text-amber-800 font-medium' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'"
                  title="แสดงเฉพาะไฟล์ที่ปักหมุด"
                  @click="pinnedOnly = !pinnedOnly"
                >
                  📌
                </button>
                <button
                  v-if="activeNotebook"
                  type="button"
                  class="text-[11px] px-2 py-0.5 rounded border transition-colors"
                  :class="showCategoryManager ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'"
                  title="จัดการหมวดหมู่ของ Notebook นี้"
                  @click="showCategoryManager = !showCategoryManager; catError = ''"
                >
                  ⚙ หมวด
                </button>
              </div>
            </div>

            <!-- Inline Category Manager -->
            <div v-if="showCategoryManager && activeNotebook" class="border border-zinc-200 rounded-lg p-2.5 space-y-2 bg-zinc-100/90 text-xs">
              <div class="font-semibold text-zinc-700 text-[11px]">หมวดหมู่ของ "{{ activeNotebook.name }}"</div>
              <div class="max-h-36 overflow-y-auto space-y-1 pr-1">
                <div v-for="c in activeNotebook.categories" :key="c" class="flex items-center gap-1 text-[11px]">
                  <template v-if="editingCat === c">
                    <input
                      v-model="editCatName"
                      type="text"
                      class="flex-1 min-w-0 px-1.5 py-0.5 text-[11px] border border-zinc-300 rounded bg-white"
                      @keyup.enter="saveEditCategory"
                    />
                    <button class="px-1.5 py-0.5 bg-zinc-900 text-white rounded text-[10px]" @click="saveEditCategory">บันทึก</button>
                    <button class="px-1.5 py-0.5 hover:bg-zinc-200 rounded text-[10px]" @click="editingCat = null">ยกเลิก</button>
                  </template>
                  <template v-else>
                    <span class="flex-1 min-w-0 truncate text-zinc-800">{{ c }} <span class="text-zinc-400">({{ categoryFileCount(activeNotebook.id, c) }})</span></span>
                    <button v-if="c !== FALLBACK" class="hover:bg-zinc-200 p-0.5 rounded text-zinc-600" title="เปลี่ยนชื่อ" @click="startEditCategory(c)">✏</button>
                    <button v-if="c !== FALLBACK" class="hover:bg-red-100 p-0.5 rounded text-red-600" title="ลบ" @click="handleDeleteCategory(c)">🗑</button>
                  </template>
                </div>
              </div>
              <div class="flex gap-1 pt-1.5 border-t border-zinc-200">
                <input
                  v-model="newCatName"
                  type="text"
                  placeholder="หมวดหมู่ใหม่..."
                  class="flex-1 min-w-0 px-2 py-1 text-[11px] border border-zinc-300 rounded bg-white"
                  @keyup.enter="handleAddCategory"
                />
                <button class="px-2 py-1 bg-zinc-900 text-white text-[10px] font-semibold rounded" @click="handleAddCategory">+ เพิ่ม</button>
              </div>
              <p v-if="catError" class="text-[10px] text-red-600">{{ catError }}</p>
            </div>
          </div>

          <!-- File List with Drag & Drop Overlay -->
          <div class="flex-1 overflow-y-auto p-2 space-y-2 relative">
            <!-- Drag & Drop Overlay -->
            <div
              v-if="draggingSidebar"
              class="absolute inset-2 z-20 bg-zinc-900/90 rounded-xl text-white flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/60 pointer-events-none"
            >
              <div class="text-3xl mb-1">📥</div>
              <div class="text-xs font-bold">วางไฟล์ที่นี่เพื่ออัปโหลด</div>
              <div class="text-[10px] text-zinc-300 mt-0.5">ลงใน {{ activeNotebook ? activeNotebook.name : 'ทั่วไป' }}</div>
            </div>

            <!-- Empty state -->
            <div v-if="!filteredFiles.length" class="p-6 text-center text-xs text-zinc-400">
              <div class="text-2xl mb-1.5">📭</div>
              <div>{{ scopedFiles.length ? 'ไม่พบไฟล์ที่ตรงกับคำค้น' : 'ยังไม่มีไฟล์ใน Notebook นี้' }}</div>
              <button
                type="button"
                class="mt-2 text-[11px] text-zinc-900 font-semibold underline"
                @click="triggerUpload"
              >
                + อัปโหลดไฟล์แรก
              </button>
            </div>

            <!-- Grouped File Items -->
            <div v-for="g in fileGroups" :key="g.key" class="space-y-1">
              <button
                v-if="groupMode === 'group'"
                type="button"
                class="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-200/50 rounded transition-colors text-left"
                @click="collapsedGroups[g.key] = !collapsedGroups[g.key]"
              >
                <span class="truncate flex items-center gap-1">
                  <span>{{ collapsedGroups[g.key] ? '▶' : '▼' }}</span>
                  <span>{{ g.name }}</span>
                </span>
                <span class="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-600">
                  {{ g.items.length }}
                </span>
              </button>

              <div v-show="!collapsedGroups[g.key]" class="space-y-1">
                <div
                  v-for="f in g.items"
                  :key="f.id"
                  class="group flex items-start gap-1.5 p-2 rounded-lg border cursor-pointer transition-all text-xs"
                  :class="selectedId === f.id
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-100/50 text-zinc-800'"
                  @click="openFileInCenter(f.id)"
                >
                  <button
                    type="button"
                    class="mt-0.5 text-xs select-none transition-opacity"
                    :class="f.pinned ? 'opacity-100' : 'opacity-20 group-hover:opacity-75'"
                    :title="f.pinned ? 'ถอดหมุด' : 'ปักหมุด'"
                    @click.stop="togglePin(f.id)"
                  >
                    📌
                  </button>

                  <div class="min-w-0 flex-1">
                    <div class="font-medium leading-snug line-clamp-2" :class="selectedId === f.id ? 'text-white' : 'text-zinc-900'">
                      {{ f.title }}
                    </div>
                    <div class="text-[10px] mt-1 flex items-center gap-1.5" :class="selectedId === f.id ? 'text-zinc-300' : 'text-zinc-400'">
                      <span v-if="!activeNotebook || groupMode === 'none'" class="truncate max-w-[80px]">📓 {{ notebookName(f.notebookId) }} • </span>
                      <span>{{ formatSize(f.size) }}</span>
                      <span>•</span>
                      <span>{{ formatDate(f.uploadedAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Resizer 1 (Left / Center) -->
      <div
        v-if="!sidebarCollapsed && !centerMaximized && !rightMaximized"
        class="hidden lg:block w-1 hover:w-1.5 bg-zinc-200 hover:bg-zinc-400 cursor-col-resize transition-all select-none z-10"
        title="ลากเพื่อปรับขนาด Sidebar"
        @mousedown="startDrag1"
      ></div>

      <!-- ========================================================= -->
      <!-- PANE 2: CENTER PANE (PDF Viewer & Matrix) (~40% - 45%)    -->
      <!-- ========================================================= -->
      <section
        class="h-full flex flex-col bg-white overflow-hidden transition-all"
        :class="[
          mobileTab !== 'pdf' ? 'hidden lg:flex' : 'flex w-full',
          centerMaximized ? 'w-full' : rightMaximized ? 'hidden' : ''
        ]"
        :style="!centerMaximized && !rightMaximized ? { width: centerWidth + '%' } : {}"
      >
        <!-- Center View Switcher Header -->
        <div class="px-3 py-1.5 border-b border-zinc-200 bg-zinc-100/70 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1 p-0.5 bg-zinc-200/80 rounded-md">
            <button
              type="button"
              class="px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1"
              :class="centerView === 'pdf' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'"
              @click="centerView = 'pdf'"
            >
              <span>📄</span>
              <span>อ่าน PDF</span>
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1"
              :class="centerView === 'matrix' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'"
              @click="centerView = 'matrix'"
            >
              <span>📊</span>
              <span>ตารางเปรียบเทียบ (Matrix)</span>
            </button>
          </div>

          <button
            type="button"
            class="hidden lg:block px-2 py-0.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-200/60 text-xs"
            :title="centerMaximized ? 'ย่อกลับ 3 ส่วน' : 'ขยายเต็มหน้าจอ'"
            @click="centerMaximized = !centerMaximized"
          >
            {{ centerMaximized ? '❐ ย่อ' : '⛶ ขยาย' }}
          </button>
        </div>

        <!-- Mode 2: Synthesis Matrix in Center Pane -->
        <div v-if="centerView === 'matrix'" class="flex-1 overflow-y-auto p-4 bg-zinc-50/40">
          <WorkspaceModuleMatrix
            v-if="curWf"
            :matrix="curWf.matrix"
            :notebook-files="scopedFiles"
            @open-file="selectedId = $event; centerView = 'pdf'"
          />
        </div>

        <!-- Mode 1: PDF Viewer & Quick Note -->
        <template v-else-if="current">
          <!-- File Toolbar -->
          <div class="px-3 py-2 border-b border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-zinc-900 truncate max-w-sm">{{ current.title }}</span>
                <span class="text-[10px] text-zinc-500 font-mono">{{ formatSize(current.size) }}</span>
              </div>
              <!-- Meta switchers -->
              <div class="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                <label class="inline-flex items-center gap-1">
                  <span>สมุด:</span>
                  <select
                    :value="current.notebookId"
                    class="px-1.5 py-0.5 text-[11px] border border-zinc-200 rounded bg-white text-zinc-800"
                    @change="moveFileToNotebook(current.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="nb in notebooks" :key="nb.id" :value="nb.id">{{ nb.name }}</option>
                  </select>
                </label>
                <label class="inline-flex items-center gap-1">
                  <span>หมวด:</span>
                  <select
                    :value="current.category"
                    class="px-1.5 py-0.5 text-[11px] border border-zinc-200 rounded bg-white text-zinc-800"
                    @change="moveFile(current.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="c in categoriesOf(current.notebookId)" :key="c" :value="c">{{ c }}</option>
                  </select>
                </label>
              </div>
            </div>

            <!-- Actions buttons -->
            <div class="flex items-center gap-1 text-xs">
              <button
                type="button"
                class="px-2 py-1 rounded border transition-colors flex items-center gap-1"
                :class="current.pinned ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'"
                @click="togglePin(current.id)"
              >
                <span>📌</span>
                <span class="hidden sm:inline">{{ current.pinned ? 'ปักหมุดแล้ว' : 'ปักหมุด' }}</span>
              </button>

              <a
                v-if="viewUrl"
                :href="viewUrl"
                :download="current.fileName"
                class="px-2 py-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                title="ดาวน์โหลดไฟล์"
              >
                📥
              </a>

              <a
                v-if="viewUrl && isPdf"
                :href="viewUrl"
                target="_blank"
                class="px-2 py-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                title="เปิดในแท็บใหม่"
              >
                ↗
              </a>

              <button
                type="button"
                class="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                title="ลบไฟล์นี้"
                @click="handleDeleteFile"
              >
                🗑
              </button>

              <!-- Maximize Center Pane -->
              <button
                type="button"
                class="hidden lg:block px-2 py-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                :title="centerMaximized ? 'ย่อกลับ 3 ส่วน' : 'ขยายเต็มหน้าจอ'"
                @click="centerMaximized = !centerMaximized"
              >
                {{ centerMaximized ? '❐' : '⛶' }}
              </button>
            </div>
          </div>

          <!-- Document Viewer Canvas -->
          <div class="flex-1 bg-zinc-100 min-h-0 relative">
            <div v-if="viewLoading" class="h-full flex items-center justify-center text-xs text-zinc-500">
              กำลังโหลดเอกสาร...
            </div>
            <iframe
              v-else-if="viewUrl && isPdf"
              :src="viewUrl"
              class="w-full h-full border-0 bg-white"
              title="PDF Viewer"
            ></iframe>
            <div v-else-if="viewUrl" class="h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
              <div class="text-4xl">📎</div>
              <div class="text-xs text-zinc-700 font-semibold">{{ current.fileName }}</div>
              <p class="text-[11px] text-zinc-500">ไฟล์นามสกุลนี้เปิดดูแบบพรีวิวในหน้าเว็บไม่ได้</p>
              <a
                :href="viewUrl"
                :download="current.fileName"
                class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
              >
                ดาวน์โหลดเพื่อเปิดด้วยโปรแกรมในเครื่อง
              </a>
            </div>
            <div v-else class="h-full flex items-center justify-center text-xs text-zinc-400">
              ไม่พบไฟล์หรือยังไม่ได้โหลด
            </div>
          </div>

          <!-- Paper Quick Note Drawer (Collapsible) -->
          <div v-if="curWf && current" class="border-t border-zinc-200 bg-amber-50/20 flex flex-col">
            <button
              type="button"
              class="px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700 hover:bg-zinc-100/60 select-none transition-colors border-b border-zinc-100"
              @click="showQuickNote = !showQuickNote"
            >
              <div class="flex items-center gap-1.5">
                <span>📝 Paper Quick Note: บันทึกย่อเฉพาะเปเปอร์นี้</span>
                <span class="text-[10px] font-normal text-zinc-400">
                  ({{ (curWf.notes[current.id] || '').length }} อักษร)
                </span>
              </div>
              <span class="text-zinc-400 text-xs">{{ showQuickNote ? '▼ ซ่อน' : '▲ จดบันทึก' }}</span>
            </button>
            <div v-show="showQuickNote" class="p-2.5">
              <textarea
                v-model="curWf.notes[current.id]"
                rows="3"
                placeholder="จดสรุปย่อเฉพาะของเปเปอร์นี้ (เช่น สรุป Method, ข้อมูล Dataset, ข้อดี-ข้อเสีย, ประเด็นที่นำมาอ้างอิง)..."
                class="w-full p-2 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 placeholder:text-zinc-400 leading-relaxed"
              ></textarea>
            </div>
          </div>
        </template>

        <!-- No File Selected Empty State -->
        <div v-else class="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
          <div class="text-4xl mb-2">📄</div>
          <div class="text-sm font-semibold text-zinc-700">ยังไม่ได้เลือกเปเปอร์เพื่อเปิดอ่าน</div>
          <p class="text-xs text-zinc-400 mt-1 max-w-xs">
            เลือกไฟล์จากรายการทางซ้าย หรือกดปุ่ม "+ อัปโหลดไฟล์" เพื่อเริ่มอ่านและจดบันทึกวิจัยไปพร้อมกัน
          </p>
        </div>
      </section>

      <!-- Resizer 2 (Center / Right) -->
      <div
        v-if="!centerMaximized && !rightMaximized"
        class="hidden lg:block w-1 hover:w-1.5 bg-zinc-200 hover:bg-zinc-400 cursor-col-resize transition-all select-none z-10"
        title="ลากเพื่อปรับขนาด Research Steps"
        @mousedown="startDrag2"
      ></div>

      <!-- ========================================================= -->
      <!-- PANE 3: RIGHT PANE (Research Workflow & Steps) (~35% - 40%)-->
      <!-- ========================================================= -->
      <section
        class="h-full flex flex-col bg-white overflow-hidden transition-all border-l border-zinc-200"
        :class="[
          mobileTab !== 'workflow' ? 'hidden lg:flex' : 'flex w-full',
          rightMaximized ? 'w-full border-l-0' : centerMaximized ? 'hidden' : ''
        ]"
        :style="!rightMaximized && !centerMaximized ? { width: rightWidth + '%' } : {}"
      >
        <!-- Top Workflow Bar: Progress & Autosave & Export -->
        <div class="p-3 border-b border-zinc-200 bg-zinc-50/70 space-y-2.5">
          <!-- Progress bar & Autosave status -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-zinc-800 flex items-center gap-1.5">
                  <span>🎯 ความคืบหน้าวิจัยรวม</span>
                  <span class="text-xs text-zinc-500 font-normal">({{ activeNotebook ? activeNotebook.name : 'ทั้งหมด' }})</span>
                </span>
                <span class="font-bold font-mono text-zinc-900">
                  {{ overallProgress(activeNotebookId) }}%
                </span>
              </div>
              <div class="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-zinc-800 to-indigo-600 rounded-full transition-all duration-300"
                  :style="{ width: overallProgress(activeNotebookId) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Auto-save indicator & Maximize button -->
            <div class="flex items-center gap-2 pl-2">
              <div
                class="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                :class="saveStatus === 'saving' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
                :title="saveStatus === 'saving' ? 'กำลังบันทึกลงเครื่องอัตโนมัติ...' : 'บันทึกความคืบหน้าแล้ว'"
              >
                <span>{{ saveStatus === 'saving' ? '⏳' : '●' }}</span>
                <span class="hidden sm:inline">{{ saveStatus === 'saving' ? 'กำลังบันทึก...' : 'บันทึกแล้ว' }}</span>
              </div>

              <button
                type="button"
                class="px-2 py-1 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold flex items-center gap-1 shadow-xs"
                title="ดาวน์โหลดข้อมูลความคืบหน้าทั้งหมดเป็น Markdown (.md)"
                @click="handleExportMarkdown"
              >
                <span>📥</span>
                <span class="hidden sm:inline">Export .md</span>
              </button>

              <button
                type="button"
                class="hidden lg:block px-2 py-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs"
                :title="rightMaximized ? 'ย่อกลับ 3 ส่วน' : 'ขยายเต็มหน้าจอ'"
                @click="rightMaximized = !rightMaximized"
              >
                {{ rightMaximized ? '❐' : '⛶' }}
              </button>
            </div>
          </div>

          <!-- Step Navigation Pills (6 Core Steps + 2 Extended Modules) -->
          <div class="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              v-for="s in STEPS"
              :key="s.key"
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border"
              :class="activeStep === s.key
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'"
              @click="activeStep = s.key"
            >
              <span
                v-if="curWf"
                class="w-2 h-2 rounded-full inline-block"
                :class="getStatusBadge(curWf.steps[s.key]?.status).dot"
              ></span>
              <span>{{ s.no }}. {{ s.title }}</span>
            </button>

            <!-- Extended Module A: Matrix -->
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border"
              :class="activeStep === 'matrix'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'"
              @click="activeStep = 'matrix'"
            >
              <span>📊</span>
              <span>Matrix</span>
            </button>

            <!-- Extended Module B: Conclusion -->
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border"
              :class="activeStep === 'conclusion'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'"
              @click="activeStep = 'conclusion'"
            >
              <span>🏁</span>
              <span>Conclusion</span>
            </button>
          </div>
        </div>

        <!-- Step Content Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <template v-if="curWf">
            <!-- Header for Core Step (1-6) -->
            <div v-if="currentStepObj" class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200">
              <div>
                <div class="text-xs font-bold text-zinc-900 flex items-center gap-2">
                  <span class="text-sm">
                    {{ STEPS.find(s => s.key === activeStep)?.no }}.
                    {{ STEPS.find(s => s.key === activeStep)?.title }}
                  </span>
                  <span class="text-zinc-500 font-normal">
                    ({{ STEPS.find(s => s.key === activeStep)?.th }})
                  </span>
                </div>
              </div>

              <!-- Step Status Dropdown -->
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-zinc-500">สถานะ:</span>
                <select
                  v-model="currentStepObj.status"
                  class="text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-zinc-800 cursor-pointer"
                  :class="getStatusBadge(currentStepObj.status).bg"
                >
                  <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                    {{ opt.label }} ({{ opt.pct }}%)
                  </option>
                </select>
              </div>
            </div>

            <!-- Dynamic Step Component Rendering -->
            <WorkspaceStepProblem
              v-if="activeStep === 'problem'"
              :step="curWf.steps.problem"
              :notebook-files="scopedFiles"
              @open-file="openFileInCenter"
            />

            <WorkspaceStepObjective
              v-else-if="activeStep === 'objective'"
              :step="curWf.steps.objective"
              :notebook-files="scopedFiles"
              @open-file="openFileInCenter"
            />

            <WorkspaceStepMethod
              v-else-if="activeStep === 'method'"
              :step="curWf.steps.method"
              :notebook-files="scopedFiles"
              @open-file="openFileInCenter"
            />

            <WorkspaceStepSetup
              v-else-if="activeStep === 'setup'"
              :step="curWf.steps.setup"
              :notebook-files="scopedFiles"
              @open-file="openFileInCenter"
            />

            <WorkspaceStepMetrics
              v-else-if="activeStep === 'metrics'"
              :step="curWf.steps.metrics"
              :notebook-files="scopedFiles"
              @open-file="openFileInCenter"
            />

            <WorkspaceStepResults
              v-else-if="activeStep === 'results'"
              :step="curWf.steps.results"
              :notebook-files="scopedFiles"
              @open-file="openFileInCenter"
            />

            <!-- Extended Module A: Literature Matrix -->
            <WorkspaceModuleMatrix
              v-else-if="activeStep === 'matrix'"
              :matrix="curWf.matrix"
              :notebook-files="scopedFiles"
              @open-file="openFileInCenter"
            />

            <!-- Extended Module B: Conclusion -->
            <WorkspaceModuleConclusion
              v-else-if="activeStep === 'conclusion'"
              :conclusion="curWf.conclusion"
            />
          </template>

          <div v-else class="text-center p-8 text-zinc-400">
            กำลังโหลดข้อมูลขั้นตอนการวิจัย...
          </div>
        </div>
      </section>
    </div>

    <!-- ========================================================= -->
    <!-- UPLOAD MODAL DIALOG                                       -->
    <!-- ========================================================= -->
    <Teleport to="body">
      <div
        v-if="showUploadModal"
        class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
        @click.self="showUploadModal = false"
      >
        <div class="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200">
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
            <h3 class="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              <span>📄 อัปโหลดไฟล์เอกสารงานวิจัย</span>
            </h3>
            <button
              type="button"
              class="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              @click="showUploadModal = false"
            >
              ✕
            </button>
          </div>

          <div class="p-5 space-y-4">
            <!-- Drop area -->
            <div
              class="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer hover:border-zinc-400 transition-colors bg-zinc-50/50"
              @click="fileInput?.click()"
            >
              <div v-if="pendingFile" class="space-y-1">
                <div class="text-sm font-bold text-zinc-900">📄 {{ pendingFile.name }}</div>
                <div class="text-xs text-zinc-500 font-mono">{{ formatSize(pendingFile.size) }}</div>
                <div class="text-[11px] text-zinc-400 mt-1">คลิกเพื่อเปลี่ยนไฟล์</div>
              </div>
              <div v-else class="space-y-1">
                <div class="text-2xl mb-1">📁</div>
                <div class="text-xs font-semibold text-zinc-800">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</div>
                <div class="text-[10px] text-zinc-400">รองรับ .pdf, .docx, .tex, .zip (บันทึกลง IndexedDB ภายในเครื่อง)</div>
              </div>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.tex,.zip"
              class="hidden"
              @change="onFilePick(($event.target as HTMLInputElement).files?.[0])"
            />

            <!-- Form fields -->
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-zinc-700 mb-1">ชื่อเอกสาร / Paper Title</label>
                <input
                  v-model="uploadForm.title"
                  type="text"
                  placeholder="ระบุชื่อสำหรับแสดงผลในรายการ..."
                  class="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-700 mb-1">Notebook</label>
                  <select
                    v-model="uploadForm.notebookId"
                    class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white"
                  >
                    <option v-for="nb in notebooks" :key="nb.id" :value="nb.id">
                      {{ nb.name }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-zinc-700 mb-1">หมวดหมู่</label>
                  <select
                    v-model="uploadForm.category"
                    class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white"
                  >
                    <option v-for="c in categoriesOf(uploadForm.notebookId)" :key="c" :value="c">
                      {{ c }}
                    </option>
                    <option :value="NEW_CATEGORY">+ สร้างหมวดใหม่...</option>
                  </select>
                </div>
              </div>

              <div v-if="uploadForm.category === NEW_CATEGORY">
                <label class="block text-xs font-semibold text-zinc-700 mb-1">ชื่อหมวดหมู่ใหม่</label>
                <input
                  v-model="uploadForm.newCategory"
                  type="text"
                  placeholder="ระบุชื่อหมวดหมู่..."
                  class="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
                />
              </div>

              <label class="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer pt-1">
                <input v-model="uploadForm.pinned" type="checkbox" class="rounded border-zinc-300 text-zinc-900" />
                <span>📌 ปักหมุดไฟล์นี้ให้อยู่บนสุด</span>
              </label>

              <p v-if="uploadError" class="text-xs text-red-600 font-medium">{{ uploadError }}</p>
            </div>
          </div>

          <div class="p-4 border-t border-zinc-100 flex items-center justify-end gap-2 bg-zinc-50">
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700"
              @click="showUploadModal = false"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 shadow-sm"
              :disabled="uploadSaving || !pendingFile"
              @click="handleSaveUpload"
            >
              {{ uploadSaving ? 'กำลังบันทึก...' : 'บันทึกไฟล์' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
