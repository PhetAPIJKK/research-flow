<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const route = useRoute()
const { files, sortedFiles, categories, addFile, getBlob, togglePin, removeFile } = useFiles()
const supabase = useSupabaseSync()

const NEW_CATEGORY = '__new__'

const selectedId = ref<string | null>(null)
const search = ref('')
const groupMode = ref<'category' | 'none'>('category')
const pinnedOnly = ref(false)
const collapsed = ref<Record<string, boolean>>({})

// viewer
const viewUrl = ref<string | null>(null)
const viewLoading = ref(false)

// upload
const pending = ref<File | null>(null)
const dragging = ref(false)
const saving = ref(false)
const error = ref('')
const form = ref({ title: '', category: 'ร่างบทความ', newCategory: '', pinned: false })
const fileInput = ref<HTMLInputElement | null>(null)

const current = computed(() => files.value.find(f => f.id === selectedId.value) || null)
const isPdf = computed(() => current.value?.type === 'application/pdf' || current.value?.fileName.toLowerCase().endsWith('.pdf'))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return sortedFiles.value.filter(f => {
    if (pinnedOnly.value && !f.pinned) return false
    if (!q) return true
    return f.title.toLowerCase().includes(q) || f.fileName.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
  })
})

const groups = computed(() => {
  if (groupMode.value === 'none') return [{ name: 'ไฟล์ทั้งหมด', items: filtered.value }]
  const map = new Map<string, typeof filtered.value>()
  for (const f of filtered.value) {
    if (!map.has(f.category)) map.set(f.category, [])
    map.get(f.category)!.push(f)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})

const revoke = () => {
  if (viewUrl.value) URL.revokeObjectURL(viewUrl.value)
  viewUrl.value = null
}

watch(selectedId, async (id) => {
  revoke()
  if (!id) return
  viewLoading.value = true
  try {
    const blob = await getBlob(id)
    if (blob && selectedId.value === id) viewUrl.value = URL.createObjectURL(blob)
  } finally {
    viewLoading.value = false
  }
})

onMounted(() => {
  const id = route.query.id
  if (typeof id === 'string') selectedId.value = id
  else if (sortedFiles.value[0]) selectedId.value = sortedFiles.value[0].id
})

// files load after mount in app.vue; select first once available
watch(() => files.value.length, (n) => {
  if (n && !selectedId.value) selectedId.value = sortedFiles.value[0]?.id || null
}, { immediate: true })

onBeforeUnmount(revoke)

const pick = (file: File | undefined | null) => {
  if (!file) return
  error.value = ''
  pending.value = file
  form.value.title = file.name.replace(/\.[^/.]+$/, '')
}

const onDrop = (e: DragEvent) => {
  dragging.value = false
  pick(e.dataTransfer?.files?.[0])
}

const cancelUpload = () => {
  pending.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const save = async () => {
  if (!pending.value) return
  const category = form.value.category === NEW_CATEGORY ? form.value.newCategory.trim() : form.value.category
  if (!category) {
    error.value = 'กรุณาระบุชื่อหมวดหมู่'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const remoteUrl = (await supabase.uploadFile(pending.value)) || undefined
    const entry = await addFile(pending.value, {
      title: form.value.title,
      category,
      pinned: form.value.pinned,
      remoteUrl
    })
    selectedId.value = entry.id
    form.value = { title: '', category, newCategory: '', pinned: false }
    cancelUpload()
  } catch (e: any) {
    error.value = 'บันทึกไฟล์ไม่สำเร็จ: ' + (e?.message || e)
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  if (!current.value) return
  if (!confirm(`ลบไฟล์ "${current.value.title}" ?`)) return
  const id = current.value.id
  await removeFile(id)
  selectedId.value = sortedFiles.value.find(f => f.id !== id)?.id || null
}
</script>

<template>
  <div class="space-y-4">
    <!-- Top bar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-lg font-bold text-zinc-900">คลังไฟล์</h1>
      <input
        v-model="search"
        type="text"
        placeholder="ค้นหาไฟล์..."
        class="w-64 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
      />
    </div>

    <!-- Upload -->
    <div class="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
      <div
        v-if="!pending"
        class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
        :class="dragging ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400'"
        @click="fileInput?.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div class="font-medium text-sm text-zinc-800">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</div>
        <div class="text-xs text-zinc-500 mt-1">PDF จะเปิดอ่านในเว็บได้ทันที (รองรับ .pdf .docx .tex .zip)</div>
      </div>
      <input ref="fileInput" type="file" accept=".pdf,.doc,.docx,.tex,.zip" class="hidden" @change="pick(($event.target as HTMLInputElement).files?.[0])" />

      <div v-if="pending" class="space-y-3">
        <div class="text-xs text-zinc-500">ไฟล์ที่เลือก: <span class="font-medium text-zinc-800">{{ pending.name }}</span> ({{ formatSize(pending.size) }})</div>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div class="md:col-span-4">
            <label class="block text-xs font-semibold text-zinc-600 mb-1">ชื่อไฟล์</label>
            <input v-model="form.title" type="text" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900" />
          </div>
          <div class="md:col-span-3">
            <label class="block text-xs font-semibold text-zinc-600 mb-1">หมวดหมู่</label>
            <select v-model="form.category" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              <option :value="NEW_CATEGORY">+ สร้างหมวดใหม่</option>
            </select>
          </div>
          <div v-if="form.category === NEW_CATEGORY" class="md:col-span-2">
            <label class="block text-xs font-semibold text-zinc-600 mb-1">ชื่อหมวดใหม่</label>
            <input v-model="form.newCategory" type="text" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg" />
          </div>
          <label class="md:col-span-2 flex items-center gap-2 px-3 py-2 border border-zinc-300 rounded-lg cursor-pointer text-sm">
            <input v-model="form.pinned" type="checkbox" /> 📌 ปักหมุด
          </label>
          <div class="md:col-span-3 flex gap-2">
            <button class="flex-1 px-3 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-50" @click="cancelUpload">ยกเลิก</button>
            <button class="flex-1 px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50" :disabled="saving" @click="save">
              {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Split view -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- Left: list -->
      <aside class="lg:col-span-4 bg-white border border-zinc-200 rounded-xl flex flex-col overflow-hidden lg:h-[70vh]">
        <div class="p-3 border-b border-zinc-100 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex p-0.5 bg-zinc-100 rounded-lg text-xs">
              <button class="px-3 py-1 rounded-md" :class="groupMode === 'category' ? 'bg-white shadow-sm font-medium' : 'text-zinc-600'" @click="groupMode = 'category'">จัดกลุ่ม</button>
              <button class="px-3 py-1 rounded-md" :class="groupMode === 'none' ? 'bg-white shadow-sm font-medium' : 'text-zinc-600'" @click="groupMode = 'none'">ทั้งหมด</button>
            </div>
            <button
              class="text-xs px-2 py-1 rounded-md"
              :class="pinnedOnly ? 'bg-amber-100 text-amber-800 font-medium' : 'text-zinc-500 hover:bg-zinc-100'"
              @click="pinnedOnly = !pinnedOnly"
            >📌 เฉพาะที่ปักหมุด</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-3">
          <div v-if="!filtered.length" class="p-6 text-center text-sm text-zinc-400">
            {{ files.length ? 'ไม่พบไฟล์ที่ตรงกับเงื่อนไข' : 'ยังไม่มีไฟล์ — อัปโหลดด้านบนได้เลย' }}
          </div>

          <div v-for="g in groups" :key="g.name">
            <button
              v-if="groupMode === 'category'"
              class="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 rounded"
              @click="collapsed[g.name] = !collapsed[g.name]"
            >
              <span>{{ collapsed[g.name] ? '▶' : '▼' }} {{ g.name }}</span>
              <span class="px-1.5 rounded-full bg-zinc-100 text-zinc-500">{{ g.items.length }}</span>
            </button>

            <div v-show="!collapsed[g.name]" class="space-y-1 mt-1">
              <div
                v-for="f in g.items"
                :key="f.id"
                class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors"
                :class="selectedId === f.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 hover:bg-zinc-50'"
                @click="selectedId = f.id"
              >
                <button
                  class="mt-0.5 text-sm leading-none"
                  :class="f.pinned ? '' : 'opacity-30 hover:opacity-100'"
                  :title="f.pinned ? 'ถอดหมุด' : 'ปักหมุด'"
                  @click.stop="togglePin(f.id)"
                >📌</button>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium leading-snug line-clamp-2">{{ f.title }}</div>
                  <div class="text-xs mt-0.5" :class="selectedId === f.id ? 'text-zinc-300' : 'text-zinc-500'">
                    {{ formatSize(f.size) }} • {{ formatDate(f.uploadedAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right: viewer -->
      <section class="lg:col-span-8 bg-white border border-zinc-200 rounded-xl flex flex-col overflow-hidden lg:h-[70vh] min-h-[420px]">
        <template v-if="current">
          <div class="px-4 py-3 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="font-semibold text-zinc-900 truncate">{{ current.title }}</div>
              <div class="text-xs text-zinc-500">{{ current.category }} • {{ current.fileName }} • {{ formatSize(current.size) }} • {{ formatDate(current.uploadedAt) }}</div>
            </div>
            <div class="flex items-center gap-1.5 text-sm">
              <button class="px-2.5 py-1 rounded-md border" :class="current.pinned ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'" @click="togglePin(current.id)">
                📌 {{ current.pinned ? 'ปักหมุดแล้ว' : 'ปักหมุด' }}
              </button>
              <a v-if="viewUrl" :href="viewUrl" :download="current.fileName" class="px-2.5 py-1 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50">ดาวน์โหลด</a>
              <a v-if="viewUrl && isPdf" :href="viewUrl" target="_blank" class="px-2.5 py-1 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50">เปิดแท็บใหม่</a>
              <button class="px-2.5 py-1 rounded-md text-red-600 hover:bg-red-50" @click="remove">ลบ</button>
            </div>
          </div>

          <div class="flex-1 bg-zinc-100 min-h-0">
            <div v-if="viewLoading" class="h-full flex items-center justify-center text-sm text-zinc-500">กำลังโหลดไฟล์...</div>
            <iframe v-else-if="viewUrl && isPdf" :src="viewUrl" class="w-full h-full border-0 bg-white" title="PDF viewer"></iframe>
            <div v-else-if="viewUrl" class="h-full flex flex-col items-center justify-center gap-2 text-center p-8">
              <div class="text-4xl">📎</div>
              <div class="text-sm text-zinc-700 font-medium">ไฟล์ชนิดนี้เปิดดูในเว็บไม่ได้</div>
              <a :href="viewUrl" :download="current.fileName" class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm">ดาวน์โหลดเพื่อเปิดอ่าน</a>
            </div>
            <div v-else class="h-full flex items-center justify-center text-sm text-zinc-500">ไม่พบข้อมูลไฟล์ในเครื่องนี้</div>
          </div>
        </template>

        <div v-else class="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-8">
          <div class="text-4xl mb-2">📄</div>
          <div class="text-sm">เลือกไฟล์ทางซ้ายเพื่อเปิดอ่านที่นี่</div>
        </div>
      </section>
    </div>
  </div>
</template>
