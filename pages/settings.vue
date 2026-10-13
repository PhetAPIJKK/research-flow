<script setup lang="ts">
import { ref } from 'vue'
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  Server,
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-vue-next'
import { useSupabaseSync } from '~/composables/useSupabaseSync'
import { useResearchWorkflow } from '~/composables/useResearchWorkflow'

const {
  supabaseUrl,
  supabaseKey,
  bucketName,
  isConnected,
  isTesting,
  lastError,
  saveConfig,
  testConnection
} = useSupabaseSync()

const { stages, papers, resetToDefault } = useResearchWorkflow()

const inputUrl = ref(supabaseUrl.value)
const inputKey = ref(supabaseKey.value)
const inputBucket = ref(bucketName.value)
const statusFeedback = ref<string | null>(null)

const handleSave = () => {
  saveConfig(inputUrl.value, inputKey.value, inputBucket.value)
  statusFeedback.value = 'บันทึกการตั้งค่าแล้ว'
  setTimeout(() => (statusFeedback.value = null), 3000)
}

const handleTest = async () => {
  handleSave()
  const success = await testConnection()
  if (success) {
    statusFeedback.value = 'เชื่อมต่อกับ Supabase สำเร็จเรียบร้อย!'
  } else {
    statusFeedback.value = 'ไม่สามารถเชื่อมต่อได้: ' + (lastError.value || 'โปรดตรวจสอบ URL และ Key')
  }
}

// Export JSON
const exportData = () => {
  const data = {
    exportDate: new Date().toISOString(),
    stages: stages.value,
    papers: papers.value
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `research-flow-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Import JSON
const importFileRef = ref<HTMLInputElement | null>(null)
const handleImport = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (parsed.stages && parsed.papers) {
          stages.value = parsed.stages
          papers.value = parsed.papers
          alert('นำเข้าข้อมูลสำเร็จ!')
        }
      } catch (err) {
        alert('ไฟล์ JSON ไม่ถูกต้อง')
      }
    }
    reader.readAsText(target.files[0])
  }
}

const confirmReset = () => {
  if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตามแบบจำลองหรือไม่?')) {
    resetToDefault()
    alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="pb-2 border-b border-zinc-200">
      <h1 class="text-2xl font-bold tracking-tight text-zinc-900">
        การเชื่อมต่อฐานข้อมูล & การตั้งค่า (Integrations & Settings)
      </h1>
      <p class="text-sm text-zinc-500">
        กำหนดการเชื่อมต่อ Supabase Database/Storage และสำรองข้อมูลขั้นตอนการทำวิจัย
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Supabase Connection Form (7 Cols) -->
      <div class="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Database class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-zinc-900">การเชื่อมต่อ Supabase Storage & Database</h2>
              <p class="text-xs text-zinc-400">สำหรับจัดเก็บไฟล์ PDF, ข้อมูลขั้นตอน และบทคัดย่องานวิจัย</p>
            </div>
          </div>

          <span
            class="text-[11px] font-medium px-2.5 py-1 rounded-full border"
            :class="isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-zinc-100 text-zinc-600 border-zinc-200'"
          >
            {{ isConnected ? 'เชื่อมต่อ Supabase แล้ว' : 'โหมด Local Fallback' }}
          </span>
        </div>

        <!-- Info Box -->
        <div class="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-600 leading-relaxed">
          หากยังไม่มีบัญชี Supabase ระบบจะจัดเก็บข้อมูลลงใน LocalStorage ของเบราว์เซอร์อัตโนมัติ 
          ทำให้สามารถใช้งานระบบและบันทึกขั้นตอนการทำวิจัยได้ทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม
        </div>

        <form @submit.prevent="handleSave" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
              Supabase Project URL
            </label>
            <input
              v-model="inputUrl"
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 font-mono text-xs"
            />
          </div>

          <div>
            <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
              Supabase Anon Key
            </label>
            <input
              v-model="inputKey"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 font-mono text-xs"
            />
          </div>

          <div>
            <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
              Storage Bucket Name
            </label>
            <input
              v-model="inputBucket"
              type="text"
              placeholder="research-papers"
              class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 font-mono text-xs"
            />
            <p class="text-[10px] text-zinc-400 mt-1">ชื่อ Bucket สำหรับอัปโหลดไฟล์ใน Supabase Storage</p>
          </div>

          <!-- Status feedback message -->
          <div v-if="statusFeedback" class="p-2.5 rounded bg-zinc-100 text-xs text-zinc-800 font-medium">
            {{ statusFeedback }}
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="handleTest"
              :disabled="isTesting"
              class="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium rounded-md transition-colors flex items-center gap-1.5"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isTesting }" />
              <span>{{ isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ' }}</span>
            </button>

            <button
              type="submit"
              class="px-4 py-2 bg-zinc-900 text-white font-medium rounded-md hover:bg-zinc-800 transition-colors"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>

      <!-- Backup, Import, & Docker (5 Cols) -->
      <div class="lg:col-span-5 space-y-6">
        <!-- Backup & Restore -->
        <div class="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <h2 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <ShieldCheck class="w-4 h-4" />
            <span>สำรองข้อมูล & กู้คืน (Backup & Restore)</span>
          </h2>
          <p class="text-xs text-zinc-500">
            สำรองขั้นตอนการวิจัย เช็คลิสต์ และรายการเปเปอร์ทั้งหมดเป็นไฟล์ JSON เพื่อนำไปใช้งานต่อ
          </p>

          <div class="space-y-2 pt-1">
            <button
              @click="exportData"
              class="w-full py-2 px-3 border border-zinc-300 hover:bg-zinc-50 rounded-md text-xs font-medium text-zinc-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Download class="w-3.5 h-3.5" />
              <span>ส่งออกข้อมูลสำรอง (Export JSON)</span>
            </button>

            <input
              type="file"
              ref="importFileRef"
              accept=".json"
              class="hidden"
              @change="handleImport"
            />
            <button
              @click="importFileRef?.click()"
              class="w-full py-2 px-3 border border-zinc-300 hover:bg-zinc-50 rounded-md text-xs font-medium text-zinc-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>นำเข้าข้อมูล (Import JSON)</span>
            </button>

            <button
              @click="confirmReset"
              class="w-full py-2 px-3 border border-red-200 hover:bg-red-50 text-red-700 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors pt-2"
            >
              <RotateCcw class="w-3.5 h-3.5 text-red-600" />
              <span>รีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้น</span>
            </button>
          </div>
        </div>

        <!-- Docker Deployment Card -->
        <div class="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-3">
          <h2 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Server class="w-4 h-4" />
            <span>การ Deploy ด้วย Docker</span>
          </h2>
          <p class="text-xs text-zinc-500 leading-relaxed">
            ระบบมาพร้อม Dockerfile และ docker-compose.yml พร้อมรันบนเซิร์ฟเวอร์ทุกแห่งด้วยคำสั่งเดียว
          </p>
          <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-[11px] overflow-x-auto font-mono">
# รันผ่าน Docker Compose
docker compose up -d --build

# หรือ Build Image เอง
docker build -t research-flow .
docker run -p 3000:3000 research-flow</pre>
        </div>
      </div>
    </div>
  </div>
</template>
