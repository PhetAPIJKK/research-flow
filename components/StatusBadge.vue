<script setup lang="ts">
import type { StageStatus, PaperStatus } from '~/types/research'

const props = defineProps<{
  status: StageStatus | PaperStatus | string
  type?: 'stage' | 'paper'
}>()

const badgeConfig = computed(() => {
  switch (props.status) {
    // Stage statuses
    case 'completed':
      return { label: 'เสร็จสิ้น (Completed)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'in_progress':
      return { label: 'กำลังดำเนินการ (In Progress)', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'under_review':
      return { label: 'รอตรวจทาน (Under Review)', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'not_started':
      return { label: 'ยังไม่เริ่ม (Not Started)', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
    
    // Paper statuses
    case 'draft':
      return { label: 'ฉบับร่าง (Draft)', bg: 'bg-zinc-100 text-zinc-700 border-zinc-300' }
    case 'revising':
      return { label: 'กำลังปรับแก้ (Revising)', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'accepted':
      return { label: 'ตอบรับแล้ว (Accepted)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    case 'published':
      return { label: 'ตีพิมพ์แล้ว (Published)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' }
    default:
      return { label: props.status, bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
    :class="badgeConfig.bg"
  >
    {{ badgeConfig.label }}
  </span>
</template>
