import { ref, computed } from 'vue'
import type { ResearchFile, Notebook } from '~/types/research'

const DB_NAME = 'research-flow'
const STORE = 'blobs'
const META_KEY = 'rf_files'
const NB_KEY = 'rf_notebooks'
const ACTIVE_KEY = 'rf_active_notebook'
const OLD_CAT_KEY = 'rf_categories' // legacy global categories (migrated into the default notebook)
const ALL = 'all'

export const FALLBACK_CATEGORY = 'เอกสารอื่นๆ'
export const DEFAULT_NOTEBOOK_ID = 'nb-default'
export const DEFAULT_NOTEBOOK_NAME = 'ทั่วไป'
const DEFAULT_CATEGORIES = ['ร่างบทความ', 'วรรณกรรม', 'การทดลอง', FALLBACK_CATEGORY]

const files = ref<ResearchFile[]>([])
const notebooks = ref<Notebook[]>([])
const activeNotebookId = ref<string | null>(null) // null = all notebooks
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

const saveFiles = () => localStorage.setItem(META_KEY, JSON.stringify(files.value))
const saveNotebooks = () => localStorage.setItem(NB_KEY, JSON.stringify(notebooks.value))
const saveActive = () => localStorage.setItem(ACTIVE_KEY, activeNotebookId.value ?? ALL)

const parse = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const uniq = (list: string[]) => Array.from(new Set(list))
const nbById = (id: string) => notebooks.value.find(n => n.id === id)

// make sure a category exists in a notebook's own list
const ensureCategory = (nbId: string, category: string) => {
  const nb = nbById(nbId)
  if (nb && !nb.categories.includes(category)) nb.categories.push(category)
}

export const useFiles = () => {
  const init = () => {
    if (loaded.value || typeof window === 'undefined') return

    files.value = parse<ResearchFile[]>(META_KEY, [])
    notebooks.value = parse<Notebook[]>(NB_KEY, [])

    // migration: create the default notebook and move legacy files/categories into it
    if (!nbById(DEFAULT_NOTEBOOK_ID)) {
      const legacy = parse<string[]>(OLD_CAT_KEY, DEFAULT_CATEGORIES)
      notebooks.value.unshift({
        id: DEFAULT_NOTEBOOK_ID,
        name: DEFAULT_NOTEBOOK_NAME,
        createdAt: new Date().toISOString(),
        categories: uniq([...legacy, FALLBACK_CATEGORY])
      })
    }
    files.value.forEach(f => {
      if (!f.notebookId || !nbById(f.notebookId)) f.notebookId = DEFAULT_NOTEBOOK_ID
    })
    notebooks.value.forEach(nb => {
      const used = files.value.filter(f => f.notebookId === nb.id).map(f => f.category)
      nb.categories = uniq([...nb.categories, ...used, FALLBACK_CATEGORY])
    })
    saveFiles()
    saveNotebooks()

    const savedActive = localStorage.getItem(ACTIVE_KEY)
    if (savedActive === ALL) activeNotebookId.value = null
    else if (savedActive && nbById(savedActive)) activeNotebookId.value = savedActive
    else activeNotebookId.value = DEFAULT_NOTEBOOK_ID

    loaded.value = true
  }

  const activeNotebook = computed(() => notebooks.value.find(n => n.id === activeNotebookId.value) || null)

  const setActive = (id: string | null) => {
    activeNotebookId.value = id
    saveActive()
  }

  const notebookName = (id: string) => nbById(id)?.name || DEFAULT_NOTEBOOK_NAME
  const notebookFileCount = (id: string) => files.value.filter(f => f.notebookId === id).length
  const categoriesOf = (id: string) => nbById(id)?.categories || []
  const categoryFileCount = (nbId: string, category: string) =>
    files.value.filter(f => f.notebookId === nbId && f.category === category).length

  // ---------- notebooks ----------
  const addNotebook = (name: string): { error: string | null; id: string | null } => {
    const n = name.trim()
    if (!n) return { error: 'กรุณาระบุชื่อ Notebook', id: null }
    if (notebooks.value.some(x => x.name === n)) return { error: 'มี Notebook ชื่อนี้อยู่แล้ว', id: null }
    const id = `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    notebooks.value.push({ id, name: n, createdAt: new Date().toISOString(), categories: [...DEFAULT_CATEGORIES] })
    saveNotebooks()
    return { error: null, id }
  }

  const renameNotebook = (id: string, name: string): string | null => {
    const n = name.trim()
    if (id === DEFAULT_NOTEBOOK_ID) return `ไม่สามารถเปลี่ยนชื่อ Notebook "${DEFAULT_NOTEBOOK_NAME}"`
    if (!n) return 'กรุณาระบุชื่อ Notebook'
    if (notebooks.value.some(x => x.id !== id && x.name === n)) return 'มี Notebook ชื่อนี้อยู่แล้ว'
    const nb = nbById(id)
    if (nb) nb.name = n
    saveNotebooks()
    return null
  }

  // files of a deleted notebook are moved into the default notebook (never deleted)
  const deleteNotebook = (id: string): string | null => {
    if (id === DEFAULT_NOTEBOOK_ID) return `ไม่สามารถลบ Notebook "${DEFAULT_NOTEBOOK_NAME}"`
    files.value.forEach(f => {
      if (f.notebookId === id) {
        ensureCategory(DEFAULT_NOTEBOOK_ID, f.category)
        f.notebookId = DEFAULT_NOTEBOOK_ID
      }
    })
    notebooks.value = notebooks.value.filter(n => n.id !== id)
    if (activeNotebookId.value === id) setActive(DEFAULT_NOTEBOOK_ID)
    saveNotebooks()
    saveFiles()
    return null
  }

  // ---------- categories (per notebook) ----------
  const addCategory = (nbId: string, name: string): string | null => {
    const n = name.trim()
    const nb = nbById(nbId)
    if (!nb) return 'ไม่พบ Notebook'
    if (!n) return 'กรุณาระบุชื่อหมวดหมู่'
    if (nb.categories.includes(n)) return 'มีหมวดหมู่นี้อยู่แล้ว'
    nb.categories.push(n)
    saveNotebooks()
    return null
  }

  const renameCategory = (nbId: string, oldName: string, newName: string): string | null => {
    const n = newName.trim()
    const nb = nbById(nbId)
    if (!nb) return 'ไม่พบ Notebook'
    if (oldName === FALLBACK_CATEGORY) return `ไม่สามารถเปลี่ยนชื่อหมวด "${FALLBACK_CATEGORY}"`
    if (!n) return 'กรุณาระบุชื่อหมวดหมู่'
    if (n === oldName) return null
    if (nb.categories.includes(n)) return 'มีหมวดหมู่นี้อยู่แล้ว'
    nb.categories = nb.categories.map(c => (c === oldName ? n : c))
    files.value.forEach(f => {
      if (f.notebookId === nbId && f.category === oldName) f.category = n
    })
    saveNotebooks()
    saveFiles()
    return null
  }

  const deleteCategory = (nbId: string, name: string): string | null => {
    const nb = nbById(nbId)
    if (!nb) return 'ไม่พบ Notebook'
    if (name === FALLBACK_CATEGORY) return `ไม่สามารถลบหมวด "${FALLBACK_CATEGORY}"`
    nb.categories = nb.categories.filter(c => c !== name)
    files.value.forEach(f => {
      if (f.notebookId === nbId && f.category === name) f.category = FALLBACK_CATEGORY
    })
    saveNotebooks()
    saveFiles()
    return null
  }

  // ---------- files ----------
  const sortedFiles = computed(() =>
    [...files.value].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.uploadedAt.localeCompare(a.uploadedAt)
    })
  )

  const addFile = async (
    file: File,
    opts: { notebookId: string; title: string; category: string; pinned: boolean; remoteUrl?: string }
  ) => {
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await idb('readwrite', s => s.put(file, id))
    ensureCategory(opts.notebookId, opts.category)
    const entry: ResearchFile = {
      id,
      notebookId: opts.notebookId,
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
    saveNotebooks()
    saveFiles()
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
      saveFiles()
    }
  }

  // change category inside the file's own notebook
  const moveFile = (id: string, category: string) => {
    const f = files.value.find(x => x.id === id)
    if (!f) return
    ensureCategory(f.notebookId, category)
    f.category = category
    saveNotebooks()
    saveFiles()
  }

  // move a file to another notebook (keeps its category, adding it there if missing)
  const moveFileToNotebook = (id: string, nbId: string) => {
    const f = files.value.find(x => x.id === id)
    if (!f || !nbById(nbId)) return
    ensureCategory(nbId, f.category)
    f.notebookId = nbId
    saveNotebooks()
    saveFiles()
  }

  const removeFile = async (id: string) => {
    await idb('readwrite', s => s.delete(id))
    files.value = files.value.filter(f => f.id !== id)
    saveFiles()
  }

  const clearAll = async () => {
    await idb('readwrite', s => s.clear())
    files.value = []
    saveFiles()
  }

  // generic binary assets (diagram/chart images) stored beside the files
  const putAsset = async (blob: Blob) => {
    const id = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await idb('readwrite', s => s.put(blob, id))
    return id
  }
  const deleteAsset = (id: string) => idb('readwrite', s => s.delete(id))

  return {
    files, sortedFiles, notebooks, activeNotebookId, activeNotebook,
    init, setActive, notebookName, notebookFileCount, categoriesOf, categoryFileCount,
    addNotebook, renameNotebook, deleteNotebook,
    addCategory, renameCategory, deleteCategory,
    addFile, getBlob, togglePin, moveFile, moveFileToNotebook, removeFile, clearAll,
    putAsset, getAsset: getBlob, deleteAsset,
    formatSize, formatDate
  }
}

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
