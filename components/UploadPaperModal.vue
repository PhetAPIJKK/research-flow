<script setup lang="ts">
import { ref, reactive } from 'vue'
import { X, Upload, FileText, GitBranch, Database, Check, Pin, Tag } from 'lucide-vue-next'
import type { ResearchPaper, PaperStatus } from '~/types/research'
import { useResearchWorkflow } from '~/composables/useResearchWorkflow'
import { useSupabaseSync } from '~/composables/useSupabaseSync'

const props = defineProps<{
  isOpen: boolean
  defaultStageId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', paper: ResearchPaper): void
}>()

const { stages, categories, addPaper } = useResearchWorkflow()
const { uploadFile, isConnected: isSupabaseConnected } = useSupabaseSync()

const isSubmitting = ref(false)
const selectedFile = ref<File | null>(null)
const customCategory = ref('')
const isCustomCategory = ref(false)

const form = reactive({
  title: '',
  abstract: '',
  authors: '',
  keywords: '',
  category: 'ร่างบทความวิจัย (Draft Manuscript)',
  stageId: props.defaultStageId || 'stage-3',
  status: 'draft' as PaperStatus,
  version: 'v0.1.0',
  isPinned: false,
  gitRepoUrl: 'https://github.com/apinan-research/edge-ai-framework',
  gitBranch: 'main',
  gitCommitHash: '',
  notes: '',
  storageType: 'local' as 'supabase' | 'git' | 'local'
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    if (!form.title) {
      // Auto fill title from file name without extension
      form.title = selectedFile.value.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    }
  }
}

// Convert File to Base64 Data URL for persistent offline browser viewing
const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const handleSubmit = async () => {
  if (!form.title) {
    alert('กรุณากรอกชื่อหัวข้องานวิจัย / Paper Title')
    return
  }

  isSubmitting.value = true
  try {
    let fileUrl: string | undefined = undefined
    let fileData: string | undefined = undefined
    let fileName: string | undefined = undefined
    let fileSize: string | undefined = undefined
    let fileType: string | undefined = undefined

    if (selectedFile.value) {
      fileName = selectedFile.value.name
      fileSize = (selectedFile.value.size / (1024 * 1024)).toFixed(2) + ' MB'
      fileType = selectedFile.value.type || 'application/pdf'

      // Always read as Data URL for in-app PDF preview
      fileData = await readFileAsDataUrl(selectedFile.value)
      fileUrl = fileData

      // Also upload to Supabase if storage provider selected
      if (form.storageType === 'supabase') {
        try {
          const uploadRes = await uploadFile(selectedFile.value)
          fileUrl = uploadRes.url
        } catch (e) {
          console.warn('Supabase upload fallback to local data url', e)
        }
      }
    }

    const finalCategory = isCustomCategory.value && customCategory.value.trim()
      ? customCategory.value.trim()
      : form.category

    const authorsList = form.authors
      ? form.authors.split(',').map(a => a.trim()).filter(Boolean)
      : ['Apinan J.']

    const keywordsList = form.keywords
      ? form.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : []

    const savedPaper = addPaper({
      title: form.title,
      abstract: form.abstract,
      authors: authorsList,
      keywords: keywordsList,
      category: finalCategory,
      stageId: form.stageId,
      status: form.status,
      version: form.version,
      isPinned: form.isPinned,
      fileName,
      fileSize,
      fileType,
      fileUrl,
      fileData,
      gitRepoUrl: form.gitRepoUrl || undefined,
      gitBranch: form.gitBranch || undefined,
      gitCommitHash: form.gitCommitHash || undefined,
      notes: form.notes,
      storageType: form.storageType
    })

    emit('saved', savedPaper)
    emit('close')

    // Reset form
    form.title = ''
    form.abstract = ''
    form.authors = ''
    form.keywords = ''
    form.isPinned = false
    selectedFile.value = null
  } catch (error) {
    console.error('Error saving paper:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกเอกสาร')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
    <div class="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[92vh] flex flex-col">
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div>
          <h2 class="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Upload class="w-4 h-4 text-zinc-700" />
            <span>อัปโหลดงานวิจัย & เอกสาร (Upload Research File)</span>
          </h2>
          <p class="text-xs text-zinc-500">
            เปิดดูเอกสาร PDF ได้โดยตรงในเว็บ จัดกลุ่มหมวดหมู่ และปักหมุดไฟล์สำคัญ
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <form @submit.prevent="handleSubmit" class="p-6 overflow-y-auto space-y-4 text-sm">
        <!-- File Upload Section (Dropzone) -->
        <div>
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
            เลือกไฟล์งานวิจัย (PDF / Document) *
          </label>
          <div class="border-2 border-dashed rounded-xl p-5 text-center transition-all bg-zinc-50/40"
               :class="selectedFile ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400'">
            <input
              type="file"
              id="paper-file-input"
              accept=".pdf,.docx,.doc,.tex,.zip"
              @change="handleFileSelect"
              class="hidden"
            />
            <label for="paper-file-input" class="cursor-pointer flex flex-col items-center">
              <Upload class="w-7 h-7 text-zinc-500 mb-1.5" />
              <span class="text-xs text-zinc-800 font-semibold">
                {{ selectedFile ? `เลือกแล้ว: ${selectedFile.name}` : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่' }}
              </span>
              <span class="text-[11px] text-zinc-400 mt-1">
                {{ selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • พร้อมเปิดอ่านในเว็บ` : 'รองรับ .pdf (เปิดอ่านในเว็บได้ทันที), .tex, .docx, .zip' }}
              </span>
            </label>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            ชื่อบทความ / หัวข้อวิจัย (Title) *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="เช่น Optimizing Deep Learning Architectures for Edge Processing"
            class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
          />
        </div>

        <!-- Category (Group) & Stage Selection -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Category Group -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                หมวดหมู่ไฟล์ (Group Category)
              </label>
              <button
                type="button"
                @click="isCustomCategory = !isCustomCategory"
                class="text-[11px] text-zinc-500 hover:text-zinc-900 underline"
              >
                {{ isCustomCategory ? 'เลือกจากรายการ' : '+ กำหนดหมวดหมู่เอง' }}
              </button>
            </div>

            <input
              v-if="isCustomCategory"
              v-model="customCategory"
              type="text"
              placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..."
              class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <select
              v-else
              v-model="form.category"
              class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <!-- Stage Selection -->
          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              ขั้นตอนวิจัยที่เกี่ยวข้อง (Stage)
            </label>
            <select
              v-model="form.stageId"
              class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white"
            >
              <option v-for="s in stages" :key="s.id" :value="s.id">
                ขั้นที่ {{ s.stepNumber }}: {{ s.title }}
              </option>
            </select>
          </div>
        </div>

        <!-- Pin & Status Options -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-zinc-50 rounded-lg border border-zinc-200">
          <!-- Pin Toggle -->
          <label class="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              v-model="form.isPinned"
              type="checkbox"
              class="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
            />
            <div>
              <span class="text-xs font-semibold text-zinc-800 flex items-center gap-1">
                <Pin class="w-3.5 h-3.5 text-zinc-700 rotate-45" />
                ปักหมุดไฟล์นี้ (Pin to top)
              </span>
              <span class="text-[11px] text-zinc-500 block">
                แสดงไว้บนสุดของรายการเสมอเพื่อให้เปิดอ่านได้สะดวก
              </span>
            </div>
          </label>

          <!-- Status Selector -->
          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              สถานะเอกสาร (Status)
            </label>
            <select
              v-model="form.status"
              class="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs bg-white"
            >
              <option value="draft">ฉบับร่าง (Draft)</option>
              <option value="revising">กำลังปรับแก้ (Revising)</option>
              <option value="in_review">รอการตรวจสอบ (In Review)</option>
              <option value="accepted">ผ่านการตอบรับ (Accepted)</option>
              <option value="published">ตีพิมพ์เผยแพร่แล้ว (Published)</option>
            </select>
          </div>
        </div>

        <!-- Abstract / Description -->
        <div>
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            บทคัดย่อ / สรุปสาระสำคัญ (Abstract)
          </label>
          <textarea
            v-model="form.abstract"
            rows="2"
            placeholder="สรุปสาระสำคัญของบทความ วัตถุประสงค์ หรือประเด็นสำคัญในไฟล์นี้..."
            class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
          ></textarea>
        </div>

        <!-- Authors & Version -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              ผู้วิจัย (Authors)
            </label>
            <input
              v-model="form.authors"
              type="text"
              placeholder="Apinan J., Advisor Name"
              class="w-full px-3 py-1.5 border border-zinc-300 rounded-md text-zinc-900 text-xs"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              เวอร์ชัน (Version)
            </label>
            <input
              v-model="form.version"
              type="text"
              placeholder="v1.0.0 หรือ Draft_final"
              class="w-full px-3 py-1.5 border border-zinc-300 rounded-md text-zinc-900 text-xs"
            />
          </div>
        </div>

        <!-- Storage Provider Selection -->
        <div class="border-t border-zinc-100 pt-3">
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            ที่จัดเก็บไฟล์ (Storage Provider)
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="form.storageType = 'local'"
              class="flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all text-xs"
              :class="form.storageType === 'local' 
                ? 'border-zinc-900 bg-zinc-50 font-medium text-zinc-900 ring-1 ring-zinc-900' 
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
            >
              <FileText class="w-3.5 h-3.5 mb-1" />
              <span>In-App / Local</span>
            </button>

            <button
              type="button"
              @click="form.storageType = 'git'"
              class="flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all text-xs"
              :class="form.storageType === 'git' 
                ? 'border-zinc-900 bg-zinc-50 font-medium text-zinc-900 ring-1 ring-zinc-900' 
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
            >
              <GitBranch class="w-3.5 h-3.5 mb-1" />
              <span>Git Reference</span>
            </button>

            <button
              type="button"
              @click="form.storageType = 'supabase'"
              class="flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all text-xs"
              :class="form.storageType === 'supabase' 
                ? 'border-zinc-900 bg-zinc-50 font-medium text-zinc-900 ring-1 ring-zinc-900' 
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
            >
              <Database class="w-3.5 h-3.5 mb-1 text-emerald-600" />
              <span>Supabase Cloud</span>
            </button>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="border-t border-zinc-100 pt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-md border border-zinc-300 text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Check class="w-4 h-4" />
            <span>{{ isSubmitting ? 'กำลังประมวลผลไฟล์...' : 'บันทึกและเปิดไฟล์' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>
