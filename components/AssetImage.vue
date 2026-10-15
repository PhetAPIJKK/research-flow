<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  assetId: string
  alt?: string
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()

const { getAsset } = useFiles()
const url = ref<string | null>(null)
const loading = ref(true)
const showModal = ref(false)

const load = async () => {
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = null
  if (!props.assetId) return
  loading.value = true
  try {
    const blob = await getAsset(props.assetId)
    if (blob) {
      url.value = URL.createObjectURL(blob)
    }
  } catch (err) {
    console.error('Failed to load asset', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.assetId, load)
onMounted(load)
onBeforeUnmount(() => {
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <div class="relative group rounded-lg border border-zinc-200 overflow-hidden bg-zinc-100 flex items-center justify-center h-28 w-36 flex-shrink-0 shadow-sm">
    <div v-if="loading" class="text-xs text-zinc-400">กำลังโหลด...</div>
    <template v-else-if="url">
      <img :src="url" :alt="alt || 'Image'" class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" @click="showModal = true" />
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
        <button type="button" class="pointer-events-auto p-1.5 rounded-full bg-white/90 text-zinc-800 hover:bg-white text-xs shadow" title="ดูรูปขนาดใหญ่" @click.stop="showModal = true">🔍</button>
        <button type="button" class="pointer-events-auto p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 text-xs shadow" title="ลบรูป" @click.stop="emit('remove')">🗑</button>
      </div>
    </template>
    <div v-else class="text-xs text-zinc-400 p-2 text-center">ไม่พบรูปภาพ</div>

    <!-- Zoom Modal -->
    <Teleport to="body">
      <div v-if="showModal && url" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" @click="showModal = false">
        <div class="relative max-w-5xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col" @click.stop>
          <div class="p-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
            <span class="text-xs font-semibold text-zinc-700">{{ alt || 'รูปภาพตัวอย่าง' }}</span>
            <button class="text-zinc-500 hover:text-zinc-800 text-sm font-bold px-2 py-0.5 rounded hover:bg-zinc-200" @click="showModal = false">✕ ปิด</button>
          </div>
          <div class="overflow-auto p-4 flex items-center justify-center bg-zinc-950/5">
            <img :src="url" :alt="alt || 'Zoomed'" class="max-w-full max-h-[75vh] object-contain rounded shadow" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
