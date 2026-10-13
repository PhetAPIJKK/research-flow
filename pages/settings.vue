<script setup lang="ts">
import { ref, watch } from 'vue'

const supabase = useSupabaseSync()
const git = useGitSync()
const { files, clearAll } = useFiles()

const sbUrl = ref('')
const sbKey = ref('')
const sbBucket = ref('research-papers')
const sbMsg = ref('')
const testing = ref(false)

const gitUrl = ref('')
const gitBranch = ref('main')
const gitToken = ref('')
const gitMsg = ref('')

// values are loaded in app.vue onMounted; sync inputs once ready
watch(supabase.url, () => {
  sbUrl.value = supabase.url.value
  sbKey.value = supabase.key.value
  sbBucket.value = supabase.bucket.value
}, { immediate: true })
watch(git.repoUrl, () => {
  gitUrl.value = git.repoUrl.value
  gitBranch.value = git.branch.value
  gitToken.value = git.token.value
}, { immediate: true })

const saveSupabase = () => {
  supabase.saveConfig(sbUrl.value, sbKey.value, sbBucket.value)
  sbMsg.value = 'บันทึกแล้ว'
}

const testSupabase = async () => {
  saveSupabase()
  testing.value = true
  const err = await supabase.testConnection()
  sbMsg.value = err ? `เชื่อมต่อไม่สำเร็จ: ${err}` : 'เชื่อมต่อ Supabase สำเร็จ'
  testing.value = false
}

const saveGit = () => {
  git.saveGitConfig(gitUrl.value, gitBranch.value, gitToken.value)
  gitMsg.value = 'บันทึกแล้ว'
}

const exportJson = () => {
  const blob = new Blob([JSON.stringify(files.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `research-flow-files-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

const reset = async () => {
  if (confirm('ลบไฟล์ทั้งหมดในเครื่องนี้? การกระทำนี้ย้อนกลับไม่ได้')) await clearAll()
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <h1 class="text-lg font-bold text-zinc-900">ตั้งค่า</h1>

    <!-- Supabase -->
    <section class="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-sm">Supabase Storage</h2>
        <span class="text-xs px-2 py-0.5 rounded-full border" :class="supabase.connected.value ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'">
          {{ supabase.connected.value ? 'ตั้งค่าแล้ว' : 'ยังไม่เชื่อมต่อ' }}
        </span>
      </div>
      <p class="text-xs text-zinc-500">ถ้าไม่เชื่อมต่อ ไฟล์จะเก็บในเบราว์เซอร์เครื่องนี้ (IndexedDB) ถ้าเชื่อมต่อ จะอัปโหลดสำเนาขึ้น Supabase ด้วย</p>
      <input v-model="sbUrl" type="url" placeholder="Project URL เช่น https://xxxx.supabase.co" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg font-mono" />
      <input v-model="sbKey" type="password" placeholder="Anon Key" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg font-mono" />
      <input v-model="sbBucket" type="text" placeholder="Bucket name" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg font-mono" />
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-50 disabled:opacity-50" :disabled="testing" @click="testSupabase">{{ testing ? 'กำลังทดสอบ...' : 'ทดสอบ' }}</button>
        <button class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800" @click="saveSupabase">บันทึก</button>
        <span class="text-xs text-zinc-600">{{ sbMsg }}</span>
      </div>
    </section>

    <!-- Git -->
    <section class="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
      <h2 class="font-semibold text-sm">Git Repository</h2>
      <input v-model="gitUrl" type="url" placeholder="https://github.com/user/repo" class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg font-mono" />
      <div class="grid grid-cols-2 gap-3">
        <input v-model="gitBranch" type="text" placeholder="Branch" class="px-3 py-2 text-sm border border-zinc-300 rounded-lg font-mono" />
        <input v-model="gitToken" type="password" placeholder="Token (ถ้าเป็น Private)" class="px-3 py-2 text-sm border border-zinc-300 rounded-lg font-mono" />
      </div>
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800" @click="saveGit">บันทึก</button>
        <a v-if="gitUrl" :href="gitUrl" target="_blank" class="text-sm text-zinc-600 hover:underline">เปิด Repository ↗</a>
        <span class="text-xs text-zinc-600">{{ gitMsg }}</span>
      </div>
    </section>

    <!-- Backup -->
    <section class="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
      <h2 class="font-semibold text-sm">ข้อมูลในเครื่องนี้</h2>
      <p class="text-xs text-zinc-500">ตอนนี้มี {{ files.length }} ไฟล์ เก็บอยู่ในเบราว์เซอร์นี้เท่านั้น</p>
      <div class="flex gap-2">
        <button class="px-3 py-1.5 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-50" @click="exportJson">ส่งออกรายการไฟล์ (JSON)</button>
        <button class="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50" @click="reset">ลบไฟล์ทั้งหมด</button>
      </div>
    </section>
  </div>
</template>
