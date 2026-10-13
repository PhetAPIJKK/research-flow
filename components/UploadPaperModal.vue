<script setup lang="ts">
import { ref, reactive } from 'vue'
import { X, Upload, FileText, GitBranch, Database, Check } from 'lucide-vue-next'
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

const { stages, addPaper } = useResearchWorkflow()
const { uploadFile, isConnected: isSupabaseConnected } = useSupabaseSync()

const isSubmitting = ref(false)
const selectedFile = ref<File | null>(null)
const uploadProgress = ref(0)

const form = reactive({
  title: '',
  abstract: '',
  authors: '',
  keywords: '',
  stageId: props.defaultStageId || 'stage-3',
  status: 'draft' as PaperStatus,
  version: 'v0.1.0',
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
  }
}

const handleSubmit = async () => {
  if (!form.title) {
    alert('กรุณากรอกชื่อหัวข้องานวิจัย / Paper Title')
    return
  }

  isSubmitting.value = true
  try {
    let fileUrl: string | undefined = undefined
    let fileName: string | undefined = undefined
    let fileSize: string | undefined = undefined
    let fileType: string | undefined = undefined

    if (selectedFile.value) {
      fileName = selectedFile.value.name
      fileSize = (selectedFile.value.size / (1024 * 1024)).toFixed(2) + ' MB'
      fileType = selectedFile.value.type || 'application/pdf'

      // Upload if storageType is supabase
      if (form.storageType === 'supabase') {
        const uploadRes = await uploadFile(selectedFile.value)
        fileUrl = uploadRes.url
      } else {
        fileUrl = URL.createObjectURL(selectedFile.value)
      }
    }

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
      stageId: form.stageId,
      status: form.status,
      version: form.version,
      fileName,
      fileSize,
      fileType,
      fileUrl,
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
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-fade-in">
    <div class="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden max-h-[90vh] flex flex-col">
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div>
          <h2 class="text-base font-semibold text-zinc-900">อัปโหลดงานวิจัย / บันทึกเอกสาร (Upload Research Paper)</h2>
          <p class="text-xs text-zinc-500">แนบไฟล์เปเปอร์ ร่างบทความวิจัย หรือผูกกับ Git Repository / Supabase</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <form @submit.prevent="handleSubmit" class="p-6 overflow-y-auto space-y-4 text-sm">
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
            class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
          />
        </div>

        <!-- Abstract -->
        <div>
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            บทคัดย่อ (Abstract / Description)
          </label>
          <textarea
            v-model="form.abstract"
            rows="3"
            placeholder="สรุปสาระสำคัญของบทความ วัตถุประสงค์ วิธีการ และผลการทดลองสั้นๆ..."
            class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
          ></textarea>
        </div>

        <!-- Stage & Status -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              ขั้นตอนการวิจัยที่เกี่ยวข้อง (Stage)
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

          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              สถานะ (Status)
            </label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white"
            >
              <option value="draft">ฉบับร่าง (Draft)</option>
              <option value="revising">กำลังปรับแก้ (Revising)</option>
              <option value="in_review">รอการตรวจสอบ (In Review)</option>
              <option value="accepted">ผ่านการตอบรับ (Accepted)</option>
              <option value="published">ตีพิมพ์เผยแพร่แล้ว (Published)</option>
            </select>
          </div>
        </div>

        <!-- Authors & Version -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              ผู้วิจัย (Authors - คั่นด้วยจุลภาค)
            </label>
            <input
              v-model="form.authors"
              type="text"
              placeholder="Apinan J., Advisor Name"
              class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              เวอร์ชัน (Version)
            </label>
            <input
              v-model="form.version"
              type="text"
              placeholder="v1.0.0 หรือ Draft_rev2"
              class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
            />
          </div>
        </div>

        <!-- Storage & Upload Target -->
        <div class="border-t border-zinc-100 pt-4">
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            ช่องทางการจัดเก็บข้อมูล (Storage & Sync Provider)
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              type="button"
              @click="form.storageType = 'local'"
              class="flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all"
              :class="form.storageType === 'local' 
                ? 'border-zinc-900 bg-zinc-50 font-medium text-zinc-900 ring-1 ring-zinc-900' 
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
            >
              <FileText class="w-4 h-4 mb-1" />
              <span class="text-xs">Local / Mock</span>
            </button>

            <button
              type="button"
              @click="form.storageType = 'git'"
              class="flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all"
              :class="form.storageType === 'git' 
                ? 'border-zinc-900 bg-zinc-50 font-medium text-zinc-900 ring-1 ring-zinc-900' 
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
            >
              <GitBranch class="w-4 h-4 mb-1" />
              <span class="text-xs">Git Tracking</span>
            </button>

            <button
              type="button"
              @click="form.storageType = 'supabase'"
              class="flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all"
              :class="form.storageType === 'supabase' 
                ? 'border-zinc-900 bg-zinc-50 font-medium text-zinc-900 ring-1 ring-zinc-900' 
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'"
            >
              <Database class="w-4 h-4 mb-1 text-emerald-600" />
              <span class="text-xs">Supabase Cloud</span>
            </button>
          </div>
        </div>

        <!-- File Upload Section -->
        <div>
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            แนบไฟล์บทความ (PDF / Word / LaTeX / ZIP)
          </label>
          <div class="border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center hover:border-zinc-400 transition-colors">
            <input
              type="file"
              id="paper-file"
              accept=".pdf,.docx,.doc,.tex,.zip"
              @change="handleFileSelect"
              class="hidden"
            />
            <label for="paper-file" class="cursor-pointer flex flex-col items-center">
              <Upload class="w-6 h-6 text-zinc-400 mb-1" />
              <span class="text-xs text-zinc-700 font-medium">
                {{ selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่' }}
              </span>
              <span class="text-[10px] text-zinc-400 mt-1">รองรับ .pdf, .tex, .docx ขนาดไม่เกิน 50 MB</span>
            </label>
          </div>
        </div>

        <!-- Git Metadata (shown if Git tracking or storage) -->
        <div v-if="form.storageType === 'git'" class="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-2">
          <div class="text-xs font-semibold text-zinc-700 flex items-center gap-1">
            <GitBranch class="w-3.5 h-3.5" />
            ข้อมูลการซิงค์ Git Repository
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="form.gitBranch"
              type="text"
              placeholder="Branch (เช่น main)"
              class="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded bg-white"
            />
            <input
              v-model="form.gitCommitHash"
              type="text"
              placeholder="Commit Hash (เช่น 9a8b7c4)"
              class="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded bg-white"
            />
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            บันทึกเพิ่มเติม (Notes)
          </label>
          <input
            v-model="form.notes"
            type="text"
            placeholder="ข้อความเตือนความจำ เช่น ส่งให้อาจารย์ที่ปรึกษาตรวจถึงส่วนที่ 3 แล้ว"
            class="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
          />
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
            <span>{{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกเอกสาร' }}</span>
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
