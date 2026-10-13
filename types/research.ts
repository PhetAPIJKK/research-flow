export interface ResearchFile {
  id: string
  title: string
  fileName: string
  category: string
  pinned: boolean
  size: number
  type: string
  uploadedAt: string
  remoteUrl?: string
}
