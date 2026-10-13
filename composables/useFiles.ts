import { ref, computed } from 'vue'
import type { ResearchFile } from '~/types/research'

const DB_NAME = 'research-flow'
const STORE = 'blobs'
const META_KEY = 'rf_files'
const CAT_KEY = 'rf_categories'
export const FALLBACK_CATEGORY = 'เอกสารอื่นๆ'
const DEFAULT_CATEGORIES = ['ร่างบทความ', 'วรรณกรรม', 'การทดลอง', FALLBACK_CATEGORY]

const files = ref<ResearchFile[]>([])
const categoryList = ref<string[]>([...DEFAULT_CATEGORIES])
const loaded = ref(false)

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const idb = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const saveMeta = () => {
  localStorage.setItem(META_KEY, JSON.stringify(files.value))
}

const saveCategories = () => {
  localStorage.setItem(CAT_KEY, JSON.stringify(categoryList.value))
}

export const useFiles = () => {
  const init = () => {
    if (loaded.value || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(META_KEY)
      files.value = raw ? JSON.parse(raw) : []
    } catch {
      files.value = []
    }
    try {
      const rawCat = localStorage.getItem(CAT_KEY)
      if (rawCat) categoryList.value = JSON.parse(rawCat)
    } catch {
      categoryList.value = [...DEFAULT_CATEGORIES]
    }
    // keep categories used by existing files + the fallback category always present
    const used = files.value.map(f => f.category)
    categoryList.value = Array.from(new Set([...categoryList.value, ...used, FALLBACK_CATEGORY]))
    loaded.value = true
  }

  const categories = computed(() => categoryList.value)

  const fileCount = (category: string) => files.value.filter(f => f.category === category).length

  const addCategory = (name: string): string | null => {
    const n = name.trim()
    if (!n) return 'กรุณาระบุชื่อหมวดหมู่'
    if (categoryList.value.includes(n)) return 'มีหมวดหมู่นี้อยู่แล้ว'
    categoryList.value.push(n)
    saveCategories()
    return null
  }

  const renameCategory = (oldName: string, newName: string): string | null => {
    const n = newName.trim()
    if (oldName === FALLBACK_CATEGORY) return `ไม่สามารถเปลี่ยนชื่อหมวด "${FALLBACK_CATEGORY}"`
    if (!n) return 'กรุณาระบุชื่อหมวดหมู่'
    if (n === oldName) return null
    if (categoryList.value.includes(n)) return 'มีหมวดหมู่นี้อยู่แล้ว'
    categoryList.value = categoryList.value.map(c => (c === oldName ? n : c))
    files.value.forEach(f => {
      if (f.category === oldName) f.category = n
    })
    saveCategories()
    saveMeta()
    return null
  }

  // files in the deleted category are moved to the fallback category (never deleted)
  const deleteCategory = (name: string): string | null => {
    if (name === FALLBACK_CATEGORY) return `ไม่สามารถลบหมวด "${FALLBACK_CATEGORY}"`
    categoryList.value = categoryList.value.filter(c => c !== name)
    files.value.forEach(f => {
      if (f.category === name) f.category = FALLBACK_CATEGORY
    })
    saveCategories()
    saveMeta()
    return null
  }

  const moveFile = (id: string, category: string) => {
    const f = files.value.find(x => x.id === id)
    if (!f) return
    f.category = category
    if (!categoryList.value.includes(category)) {
      categoryList.value.push(category)
      saveCategories()
    }
    saveMeta()
  }

  // pinned first, then newest first
  const sortedFiles = computed(() =>
    [...files.value].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.uploadedAt.localeCompare(a.uploadedAt)
    })
  )

  const addFile = async (
    file: File,
    opts: { title: string; category: string; pinned: boolean; remoteUrl?: string }
  ) => {
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await idb('readwrite', s => s.put(file, id))
    const entry: ResearchFile = {
      id,
      title: opts.title.trim() || file.name,
      fileName: file.name,
      category: opts.category,
      pinned: opts.pinned,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      remoteUrl: opts.remoteUrl
    }
    files.value.push(entry)
    saveMeta()
    return entry
  }

  const getBlob = async (id: string): Promise<Blob | null> => {
    const b = await idb<Blob | undefined>('readonly', s => s.get(id))
    return b || null
  }

  const togglePin = (id: string) => {
    const f = files.value.find(x => x.id === id)
    if (f) {
      f.pinned = !f.pinned
      saveMeta()
    }
  }

  const removeFile = async (id: string) => {
    await idb('readwrite', s => s.delete(id))
    files.value = files.value.filter(f => f.id !== id)
    saveMeta()
  }

  const clearAll = async () => {
    await idb('readwrite', s => s.clear())
    files.value = []
    saveMeta()
  }

  return {
    files, sortedFiles, categories, init, addFile, getBlob, togglePin, removeFile, clearAll,
    fileCount, addCategory, renameCategory, deleteCategory, moveFile
  }
}

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
