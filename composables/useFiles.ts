import { ref, computed } from 'vue'
import type { ResearchFile } from '~/types/research'

const DB_NAME = 'research-flow'
const STORE = 'blobs'
const META_KEY = 'rf_files'
const DEFAULT_CATEGORIES = ['ร่างบทความ', 'วรรณกรรม', 'การทดลอง', 'เอกสารอื่นๆ']

const files = ref<ResearchFile[]>([])
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

export const useFiles = () => {
  const init = () => {
    if (loaded.value || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(META_KEY)
      files.value = raw ? JSON.parse(raw) : []
    } catch {
      files.value = []
    }
    loaded.value = true
  }

  const categories = computed(() =>
    Array.from(new Set([...DEFAULT_CATEGORIES, ...files.value.map(f => f.category)]))
  )

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

  return { files, sortedFiles, categories, init, addFile, getBlob, togglePin, removeFile, clearAll }
}

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
