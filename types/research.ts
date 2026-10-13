export interface Notebook {
  id: string
  name: string
  createdAt: string
  // categories are per-notebook
  categories: string[]
}

export interface ResearchFile {
  id: string
  notebookId: string
  title: string
  fileName: string
  category: string
  pinned: boolean
  size: number
  type: string
  uploadedAt: string
  remoteUrl?: string
}
