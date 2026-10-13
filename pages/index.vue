<script setup lang="ts">
import { ref } from 'vue'
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  GitBranch,
  Database,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  Plus
} from 'lucide-vue-next'
import { useResearchWorkflow } from '~/composables/useResearchWorkflow'
import { useGitSync } from '~/composables/useGitSync'
import { useSupabaseSync } from '~/composables/useSupabaseSync'

const { stages, papers, overallProgress, getStageProgress } = useResearchWorkflow()
const { repoUrl, commits, isConnected: isGitConnected } = useGitSync()
const { isConnected: isSupabaseConnected } = useSupabaseSync()

const isUploadModalOpen = ref(false)

const completedCount = computed(() => stages.value.filter(s => s.status === 'completed').length)
const inProgressCount = computed(() => stages.value.filter(s => s.status === 'in_progress').length)
</script>

<template>
  <div class="space-y-10">
    <!-- Hero / Summary Header -->
    <div class="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm relative overflow-hidden">
      <div class="max-w-3xl space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
          <Sparkles class="w-3.5 h-3.5 text-zinc-600" />
          <span>Research Lifecycle & Manuscript Management</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          ขั้นตอนการทำวิจัยและติดตามเอกสารวิชาการ
        </h1>
        <p class="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
          ระบบควบคุมกระบวนการวิจัยแบบเป็นลำดับขั้นตอน (7 Stages Methodology) พร้อมเชื่อมต่อพื้นที่จัดเก็บเอกสาร
          ผ่าน <strong>Git</strong> และ <strong>Supabase</strong> สำหรับเตรียมผลงานตีพิมพ์อย่างเป็นระบบ
        </p>
      </div>

      <!-- Overall Progress Bar -->
      <div class="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div class="md:col-span-2 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-zinc-700">ความคืบหน้าภาพรวมของงานวิจัย</span>
            <span class="font-bold text-zinc-900">{{ overallProgress }}%</span>
          </div>
          <div class="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
            <div
              class="bg-zinc-900 h-2.5 rounded-full transition-all duration-500"
              :style="{ width: `${overallProgress}%` }"
            ></div>
          </div>
          <div class="flex items-center gap-4 text-xs text-zinc-500 pt-1">
            <span>เสร็จแล้ว {{ completedCount }}/7 ขั้นตอน</span>
            <span>&bull;</span>
            <span>กำลังดำเนินการ {{ inProgressCount }} ขั้นตอน</span>
          </div>
        </div>

        <!-- Quick Integration Status Cards -->
        <div class="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/60">
          <div class="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
            <GitBranch class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <div class="text-xs font-semibold text-zinc-900 truncate">Git Repository</div>
            <div class="text-[11px] text-zinc-500 truncate">{{ repoUrl ? 'เชื่อมต่อแล้ว' : 'ยังไม่ระบุ URL' }}</div>
          </div>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/60">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Database class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <div class="text-xs font-semibold text-zinc-900 truncate">Supabase Cloud</div>
            <div class="text-[11px] text-zinc-500 truncate">
              {{ isSupabaseConnected ? 'เชื่อมต่อสำเร็จ' : 'Local Fallback พร้อมใช้งาน' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7 Stages of Research Roadmap (Core Feature) -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-zinc-900">ผังขั้นตอนการทำวิจัย (7 Research Stages)</h2>
          <p class="text-xs text-zinc-500">คลิกที่ขั้นตอนเพื่อดูรายการสิ่งที่ต้องทำ (Checklist) และเอกสารที่ต้องส่งมอบ</p>
        </div>
        <NuxtLink
          to="/workflow"
          class="text-xs font-medium text-zinc-900 hover:text-zinc-600 flex items-center gap-1 group"
        >
          <span>ดูรายละเอียดเชิงลึกทั้งหมด</span>
          <ChevronRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="stage in stages"
          :key="stage.id"
          :to="`/workflow?stage=${stage.id}`"
          class="group bg-white p-5 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                ขั้นตอนที่ 0{{ stage.stepNumber }}
              </span>
              <StatusBadge :status="stage.status" type="stage" />
            </div>

            <div>
              <h3 class="font-semibold text-sm text-zinc-900 group-hover:text-zinc-700 transition-colors">
                {{ stage.title }}
              </h3>
              <p class="text-xs text-zinc-400 font-mono mt-0.5">{{ stage.titleEn }}</p>
              <p class="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
                {{ stage.shortDesc }}
              </p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-zinc-100 space-y-2">
            <!-- Stage mini progress -->
            <div class="flex items-center justify-between text-[11px] text-zinc-500">
              <span>เช็กลิสต์ ({{ stage.checklist.filter(c => c.completed).length }}/{{ stage.checklist.length }})</span>
              <span class="font-medium text-zinc-700">{{ getStageProgress(stage) }}%</span>
            </div>
            <div class="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-zinc-800 h-1.5 rounded-full"
                :style="{ width: `${getStageProgress(stage)}%` }"
              ></div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Dual Section: Recent Papers & Git Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Papers (2 Cols) -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-zinc-900">เอกสารวิจัยล่าสุด (Research Papers & Drafts)</h2>
            <p class="text-xs text-zinc-500">เอกสารที่อัปโหลดและผูกกับขั้นตอนวิจัย</p>
          </div>
          <button
            @click="isUploadModalOpen = true"
            class="text-xs font-medium px-3 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-1 shadow-sm"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>เพิ่มเปเปอร์</span>
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="paper in papers"
            :key="paper.id"
            class="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <StatusBadge :status="paper.status" type="paper" />
                  <span class="text-[11px] font-mono text-zinc-400">{{ paper.version }}</span>
                  <span class="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono">
                    {{ paper.storageType }}
                  </span>
                </div>
                <h4 class="font-semibold text-sm text-zinc-900">{{ paper.title }}</h4>
                <p class="text-xs text-zinc-500">
                  ผู้วิจัย: {{ paper.authors.join(', ') }} &bull; อัปเดตล่าสุด: {{ paper.updatedAt }}
                </p>
              </div>

              <NuxtLink
                :to="`/papers?id=${paper.id}`"
                class="p-2 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
              >
                <ArrowRight class="w-4 h-4" />
              </NuxtLink>
            </div>

            <p class="text-xs text-zinc-600 line-clamp-2 leading-relaxed bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-100">
              {{ paper.abstract }}
            </p>

            <div class="flex items-center justify-between text-xs pt-1">
              <div class="flex items-center gap-3 text-zinc-500">
                <span v-if="paper.fileName" class="flex items-center gap-1">
                  <FileText class="w-3.5 h-3.5 text-zinc-400" />
                  {{ paper.fileName }} ({{ paper.fileSize }})
                </span>
                <span v-if="paper.gitCommitHash" class="flex items-center gap-1 font-mono text-[11px]">
                  <GitBranch class="w-3.5 h-3.5 text-zinc-400" />
                  commit {{ paper.gitCommitHash }}
                </span>
              </div>

              <NuxtLink
                :to="`/papers?id=${paper.id}`"
                class="text-xs font-medium text-zinc-900 hover:underline"
              >
                จัดการ &rarr;
              </NuxtLink>
            </div>
          </div>

          <div v-if="papers.length === 0" class="p-8 text-center bg-white rounded-xl border border-zinc-200 text-zinc-500 text-xs">
            ยังไม่มีงานวิจัยในระบบ คลิก "+ เพิ่มเปเปอร์" เพื่อเริ่มอัปโหลด
          </div>
        </div>
      </div>

      <!-- Git Commits & Quick Sync (1 Col) -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-zinc-900">Git Commit Feed</h2>
            <p class="text-xs text-zinc-500">ประวัติการบันทึกโค้ดและเปเปอร์</p>
          </div>
          <NuxtLink to="/git-sync" class="text-xs font-medium text-zinc-900 hover:underline">
            ดูทั้งหมด
          </NuxtLink>
        </div>

        <div class="bg-white p-4 rounded-xl border border-zinc-200 space-y-4">
          <div class="flex items-center justify-between text-xs pb-3 border-b border-zinc-100">
            <span class="text-zinc-500 truncate max-w-[160px] font-mono">{{ repoUrl }}</span>
            <span class="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[11px]">branch: main</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="commit in commits.slice(0, 4)"
              :key="commit.hash"
              class="border-b border-zinc-50 pb-2.5 last:border-0 last:pb-0"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs font-semibold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded">
                  {{ commit.hash }}
                </span>
                <span class="text-[11px] text-zinc-400">{{ commit.date.substring(5) }}</span>
              </div>
              <p class="text-xs text-zinc-700 mt-1 font-normal line-clamp-2">
                {{ commit.message }}
              </p>
              <div class="text-[10px] text-zinc-400 mt-0.5">โดย {{ commit.author }}</div>
            </div>
          </div>

          <NuxtLink
            to="/git-sync"
            class="block w-full py-2 text-center text-xs font-medium bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 text-zinc-700 transition-colors"
          >
            เปิดหน้าเชื่อมต่อ Git & Overleaf
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Upload Paper Modal -->
    <UploadPaperModal
      :is-open="isUploadModalOpen"
      @close="isUploadModalOpen = false"
    />
  </div>
</template>
