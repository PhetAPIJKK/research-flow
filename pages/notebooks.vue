<script setup lang="ts">
import { ref } from 'vue'

const {
  notebooks, files, setActive, notebookFileCount, categoriesOf,
  addNotebook, renameNotebook, deleteNotebook
} = useFiles()

const newName = ref('')
const error = ref('')
const editing = ref<string | null>(null)
const editName = ref('')

const open = (id: string | null) => {
  setActive(id)
  navigateTo('/files')
}

const create = () => {
  const res = addNotebook(newName.value)
  error.value = res.error || ''
  if (!res.error) newName.value = ''
}

const startEdit = (id: string, name: string) => {
  editing.value = id
  editName.value = name
  error.value = ''
}

const confirmEdit = () => {
  if (!editing.value) return
  error.value = renameNotebook(editing.value, editName.value) || ''
  if (!error.value) editing.value = null
}

const remove = (id: string, name: string) => {
  const n = notebookFileCount(id)
  const msg = n
    ? `ลบ Notebook "${name}" ? ไฟล์ ${n} ไฟล์จะถูกย้ายไป Notebook "ทั่วไป"`
    : `ลบ Notebook "${name}" ?`
  if (!confirm(msg)) return
  error.value = deleteNotebook(id) || ''
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-bold text-zinc-900">Notebook</h1>
        <p class="text-sm text-zinc-500">1 Notebook = 1 หัวข้อวิจัย เลือกเปิดเพื่อดูไฟล์ในหัวข้อนั้น</p>
      </div>
      <form class="flex gap-2" @submit.prevent="create">
        <input
          v-model="newName"
          type="text"
          placeholder="ชื่อ Notebook ใหม่..."
          class="w-56 px-3 py-1.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
        <button type="submit" class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800">+ สร้าง Notebook</button>
      </form>
    </div>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- All notebooks -->
      <div
        class="bg-zinc-900 text-white rounded-xl p-5 cursor-pointer hover:bg-zinc-800 transition-colors flex flex-col justify-between min-h-[150px]"
        @click="open(null)"
      >
        <div>
          <div class="text-2xl">📚</div>
          <div class="font-semibold mt-2">ทุก Notebook</div>
          <div class="text-xs text-zinc-300 mt-1">ดูไฟล์ทั้งหมด จัดกลุ่มตามชื่อ Notebook</div>
        </div>
        <div class="text-xs text-zinc-300">{{ files.length }} ไฟล์ • {{ notebooks.length }} Notebook</div>
      </div>

      <div
        v-for="nb in notebooks"
        :key="nb.id"
        class="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 transition-colors flex flex-col justify-between min-h-[150px]"
      >
        <div class="space-y-1">
          <div class="text-2xl">📓</div>
          <template v-if="editing === nb.id">
            <input v-model="editName" type="text" class="w-full px-2 py-1 text-sm border border-zinc-300 rounded-md" @keyup.enter="confirmEdit" />
            <div class="flex gap-1.5 pt-1">
              <button class="text-xs px-2 py-1 rounded-md bg-zinc-900 text-white" @click="confirmEdit">บันทึก</button>
              <button class="text-xs px-2 py-1 rounded-md hover:bg-zinc-100" @click="editing = null">ยกเลิก</button>
            </div>
          </template>
          <template v-else>
            <div class="font-semibold text-zinc-900 break-words">{{ nb.name }}</div>
            <div class="text-xs text-zinc-500">{{ notebookFileCount(nb.id) }} ไฟล์ • {{ categoriesOf(nb.id).length }} หมวดหมู่</div>
          </template>
        </div>
        <div v-if="editing !== nb.id" class="flex items-center gap-1.5 pt-3">
          <button class="flex-1 text-sm px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800" @click="open(nb.id)">เปิด</button>
          <template v-if="nb.id !== 'nb-default'">
            <button class="text-sm px-2 py-1.5 rounded-lg hover:bg-zinc-100" title="เปลี่ยนชื่อ" @click="startEdit(nb.id, nb.name)">✏</button>
            <button class="text-sm px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-600" title="ลบ" @click="remove(nb.id, nb.name)">🗑</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
