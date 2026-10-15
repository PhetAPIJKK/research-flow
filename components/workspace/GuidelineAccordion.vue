<script setup lang="ts">
import { ref, computed } from 'vue'
import { GUIDELINES } from '~/composables/useResearchGuidelines'

const props = defineProps<{
  stepKey: string
  completedDodIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:completedDodIds', val: string[]): void
  (e: 'insert-template'): void
}>()

const isOpen = ref(false)
const guide = computed(() => GUIDELINES[props.stepKey] || null)

const completedCount = computed(() => {
  if (!guide.value || !props.completedDodIds) return 0
  return guide.value.dod.filter(d => props.completedDodIds?.includes(d.id)).length
})

const totalCount = computed(() => guide.value?.dod.length || 0)

const isChecked = (id: string) => props.completedDodIds?.includes(id) ?? false

const toggleDod = (id: string) => {
  const current = [...(props.completedDodIds || [])]
  const idx = current.indexOf(id)
  if (idx === -1) {
    current.push(id)
  } else {
    current.splice(idx, 1)
  }
  emit('update:completedDodIds', current)
}

const onInsertTemplate = () => {
  if (confirm(`ดึงโครงสร้างตัวอย่างของ "${guide.value?.title}" ใส่ในฟอร์มขั้นตอนนี้? (ข้อมูลที่มีอยู่อาจถูกเขียนทับหรือเติมต่อ)`)) {
    emit('insert-template')
  }
}
</script>

<template>
  <div v-if="guide" class="rounded-xl border border-amber-200/90 bg-gradient-to-b from-amber-50/50 to-orange-50/20 overflow-hidden shadow-xs">
    <!-- Header Toolbar -->
    <div class="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-amber-50/60 border-b border-amber-200/70">
      <button
        type="button"
        class="flex items-center gap-2 text-xs font-bold text-amber-950 hover:text-amber-800 select-none cursor-pointer text-left"
        @click="isOpen = !isOpen"
      >
        <span class="text-sm">💡</span>
        <span>ไกด์ไลน์ & แนวคิดนักวิจัย: {{ guide.title }}</span>
        <span
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
          :class="completedCount === totalCount && totalCount > 0
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-white/80 text-amber-800 border-amber-200'"
        >
          DoD: {{ completedCount }}/{{ totalCount }} สำเร็จ
        </span>
        <span class="text-xs text-amber-600 transition-transform duration-200" :class="isOpen ? 'rotate-180' : ''">
          ▼
        </span>
      </button>

      <button
        type="button"
        class="text-xs px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/70 text-amber-900 font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        title="นำโครงสร้าง Template มาตรฐานใส่ลงในแบบฟอร์มขั้นตอนนี้ทันที"
        @click="onInsertTemplate"
      >
        <span>📝</span>
        <span>ดึงโครงสร้างเริ่มต้น (Insert Template)</span>
      </button>
    </div>

    <!-- Quick DoD Bar (Visible when accordion is closed) -->
    <div v-if="!isOpen" class="px-3.5 py-2 bg-white/40 flex flex-wrap items-center gap-3 text-xs">
      <span class="text-[11px] font-bold text-zinc-600">DoD Checklist:</span>
      <label
        v-for="item in guide.dod"
        :key="item.id"
        class="inline-flex items-center gap-1.5 cursor-pointer text-zinc-700 hover:text-zinc-900 select-none text-[11px]"
      >
        <input
          type="checkbox"
          :checked="isChecked(item.id)"
          class="rounded border-amber-300 text-amber-700 focus:ring-amber-500 w-3.5 h-3.5"
          @change="toggleDod(item.id)"
        />
        <span :class="isChecked(item.id) ? 'line-through text-zinc-400 font-normal' : 'font-medium'">
          {{ item.label }}
        </span>
      </label>
    </div>

    <!-- Expanded Accordion Content -->
    <div v-show="isOpen" class="p-3.5 space-y-3.5 text-xs bg-white/70">
      <!-- 1. Researcher Mindset -->
      <div class="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 space-y-1">
        <div class="font-bold text-amber-950 flex items-center gap-1.5">
          <span>🧠 แนวคิดสำหรับนักวิจัย (Researcher Mindset)</span>
        </div>
        <p class="text-amber-900 leading-relaxed font-serif italic text-[11px] pl-2 border-l-2 border-amber-400">
          "{{ guide.mindset }}"
        </p>
      </div>

      <!-- 2. Action Items -->
      <div class="space-y-1.5">
        <div class="font-bold text-zinc-800 flex items-center gap-1.5 text-xs">
          <span>🎯 สิ่งที่ต้องทำในขั้นตอนนี้ (Action Items)</span>
        </div>
        <ul class="space-y-1 pl-1 text-[11px] text-zinc-700">
          <li v-for="(task, idx) in guide.tasks" :key="idx" class="flex items-start gap-1.5">
            <span class="text-amber-600 font-bold">•</span>
            <span class="leading-relaxed">{{ task }}</span>
          </li>
        </ul>
      </div>

      <!-- 3. Definition of Done (DoD) Interactive Checklist -->
      <div class="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-bold text-zinc-800 flex items-center gap-1.5 text-xs">
            <span>✅ สิ่งที่ต้องได้ก่อนผ่านขั้นตอนนี้ (Definition of Done - DoD Checklist)</span>
          </span>
          <span class="text-[10px] text-zinc-500">
            {{ completedCount === totalCount ? '🎉 ครบถ้วนทุกข้อแล้ว' : 'ติ๊กเลือกเมื่อทำครบตามข้อกำหนด' }}
          </span>
        </div>

        <div class="space-y-1.5">
          <div
            v-for="item in guide.dod"
            :key="item.id"
            class="flex items-start gap-2 p-1.5 rounded transition-colors"
            :class="isChecked(item.id) ? 'bg-emerald-50/60' : 'hover:bg-zinc-100/60'"
          >
            <input
              type="checkbox"
              :checked="isChecked(item.id)"
              class="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-800 w-4 h-4 cursor-pointer"
              @change="toggleDod(item.id)"
            />
            <span
              class="text-xs cursor-pointer select-none leading-snug"
              :class="isChecked(item.id) ? 'line-through text-zinc-400' : 'text-zinc-800 font-medium'"
              @click="toggleDod(item.id)"
            >
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
