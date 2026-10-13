<script setup lang="ts">
import { ref } from 'vue'
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Code,
  BookOpen,
  Terminal,
  Plus
} from 'lucide-vue-next'
import { useGitSync } from '~/composables/useGitSync'

const {
  repoUrl,
  branch,
  githubToken,
  isConnected,
  isSyncing,
  lastSyncTime,
  commits,
  syncError,
  saveGitConfig,
  syncWithRemote,
  addManualCommit
} = useGitSync()

const inputRepoUrl = ref(repoUrl.value)
const inputBranch = ref(branch.value)
const inputToken = ref(githubToken.value)
const saveSuccess = ref(false)

const manualMsg = ref('')
const manualHash = ref('')

const handleSaveConfig = () => {
  saveGitConfig(inputRepoUrl.value, inputBranch.value, inputToken.value)
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)
}

const handleAddManualCommit = () => {
  if (!manualMsg.value.trim()) return
  addManualCommit(manualMsg.value.trim(), manualHash.value.trim() || undefined)
  manualMsg.value = ''
  manualHash.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900">
          Git & Repository Sync (การเชื่อมต่อคลังเอกสาร & โค้ดวิจัย)
        </h1>
        <p class="text-sm text-zinc-500">
          เชื่อมโยงงานวิจัยกับ GitHub, GitLab หรือ Overleaf เพื่อติดตามการเปลี่ยนแปลงของระเบียบวิธีและผลการทดลอง
        </p>
      </div>

      <button
        @click="syncWithRemote"
        :disabled="isSyncing"
        class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncing }" />
        <span>{{ isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลกับ Git เดี๋ยวนี้' }}</span>
      </button>
    </div>

    <!-- Alert / Sync Notification -->
    <div v-if="syncError" class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
      <AlertCircle class="w-4 h-4 shrink-0 text-amber-600" />
      <span>{{ syncError }}</span>
    </div>

    <!-- 2 Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Config Form & Manual Log (5 Cols) -->
      <div class="lg:col-span-5 space-y-6">
        <!-- Git Connection Form -->
        <div class="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <GitBranch class="w-4 h-4" />
              <span>การตั้งค่า Git Repository</span>
            </h2>
            <span
              v-if="isConnected"
              class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
            >
              <CheckCircle2 class="w-3 h-3" />
              เชื่อมต่อแล้ว
            </span>
          </div>

          <form @submit.prevent="handleSaveConfig" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
                Repository URL (GitHub / GitLab)
              </label>
              <input
                v-model="inputRepoUrl"
                type="url"
                placeholder="https://github.com/username/research-repo"
                class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
                  Branch
                </label>
                <input
                  v-model="inputBranch"
                  type="text"
                  placeholder="main"
                  class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
                />
              </div>

              <div>
                <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
                  GitHub Token (ถ้าเป็น Private)
                </label>
                <input
                  v-model="inputToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
                />
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between">
              <span v-if="saveSuccess" class="text-[11px] text-emerald-600 font-medium">
                บันทึกการตั้งค่าเรียบร้อย!
              </span>
              <span v-else class="text-[11px] text-zinc-400">
                ซิงค์ล่าสุด: {{ lastSyncTime }}
              </span>

              <button
                type="submit"
                class="px-4 py-2 bg-zinc-900 text-white font-medium rounded-md hover:bg-zinc-800 transition-colors"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </form>
        </div>

        <!-- Manual Commit Logger -->
        <div class="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Terminal class="w-4 h-4" />
              <span>บันทึกความคืบหน้าแบบรวดเร็ว (Quick Commit Log)</span>
            </h2>
            <p class="text-xs text-zinc-500 mt-0.5">
              บันทึก Milestone เมื่อเขียนเปเปอร์หรือรันโมเดลใน Overleaf / Local Git
            </p>
          </div>

          <form @submit.prevent="handleAddManualCommit" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
                ข้อความ Commit (Commit Message)
              </label>
              <input
                v-model="manualMsg"
                type="text"
                required
                placeholder="เช่น ปรับแก้ตารางเปรียบเทียบในบทที่ 4 ตามคำแนะนำอาจารย์"
                class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs"
              />
            </div>

            <div>
              <label class="block font-semibold text-zinc-700 uppercase tracking-wider text-[11px] mb-1">
                Commit SHA Hash (ถ้ามี)
              </label>
              <input
                v-model="manualHash"
                type="text"
                placeholder="เช่น a1b2c3d (เว้นว่างเพื่อสุ่มอัตโนมัติ)"
                class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              class="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>บันทึก Log ลงใน Timeline</span>
            </button>
          </form>
        </div>

        <!-- Guide for Overleaf & Git integration -->
        <div class="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3 text-xs text-zinc-600">
          <div class="font-semibold text-zinc-900 flex items-center gap-1.5">
            <BookOpen class="w-4 h-4 text-zinc-700" />
            <span>คำแนะนำ: เชื่อมต่อ Overleaf กับ Git</span>
          </div>
          <p class="leading-relaxed">
            สามารถเชื่อมโยงโปรเจกต์ Overleaf เข้ากับ Git ได้โดยตรง (สำหรับ Overleaf Premium หรือ Git Bridge) 
            ช่วยให้สามารถดึง (pull) และส่ง (push) รหัสต้นฉบับ LaTeX ไปยัง GitHub อัตโนมัติทุกครั้งที่มีการปรับปรุงบทความ
          </p>
          <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-[11px] overflow-x-auto font-mono">
git clone git@git.overleaf.com/your-project-id
git remote add github https://github.com/user/paper
git push github main</pre>
        </div>
      </div>

      <!-- Right Column: Commit Timeline (7 Cols) -->
      <div class="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 class="text-sm font-bold text-zinc-900">ประวัติความคืบหน้า (Git Commit History)</h2>
            <p class="text-xs text-zinc-500">ไทม์ไลน์การเปลี่ยนแปลงของโค้ดและการเขียนบทความวิจัย</p>
          </div>
          <span class="text-xs text-zinc-400 font-mono">{{ commits.length }} รายการ</span>
        </div>

        <div class="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-zinc-200">
          <div
            v-for="commit in commits"
            :key="commit.hash"
            class="relative flex items-start gap-4 pl-8 group"
          >
            <!-- Timeline dot -->
            <div class="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-zinc-900 group-hover:scale-110 transition-transform"></div>

            <div class="flex-1 bg-zinc-50/60 p-3.5 rounded-lg border border-zinc-200/80 hover:bg-white hover:border-zinc-300 transition-all space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs font-semibold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-2xs">
                  {{ commit.hash }}
                </span>
                <span class="text-[11px] text-zinc-400 font-mono">{{ commit.date }}</span>
              </div>

              <p class="text-xs text-zinc-800 font-normal leading-relaxed">
                {{ commit.message }}
              </p>

              <div class="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
                <span>บันทึกโดย: {{ commit.author }}</span>
                <a
                  v-if="commit.url"
                  :href="commit.url"
                  target="_blank"
                  class="text-zinc-600 hover:text-zinc-900 flex items-center gap-1 hover:underline"
                >
                  <span>เปิดบนเว็บ</span>
                  <ExternalLink class="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
