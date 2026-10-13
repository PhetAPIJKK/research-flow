export type StageStatus = 'not_started' | 'in_progress' | 'under_review' | 'completed'

export interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  notes?: string
}

export interface ResearchStage {
  id: string
  stepNumber: number
  title: string
  titleEn: string
  shortDesc: string
  fullDesc: string
  status: StageStatus
  checklist: ChecklistItem[]
  tips: string[]
  deliverables: string[]
  dueDate?: string
  lastUpdated?: string
}

export type PaperStatus = 'draft' | 'in_review' | 'revising' | 'accepted' | 'published'

export interface ResearchPaper {
  id: string
  title: string
  abstract: string
  authors: string[]
  keywords: string[]
  stageId: string
  status: PaperStatus
  version: string
  fileUrl?: string
  fileName?: string
  fileSize?: string
  fileType?: string
  gitRepoUrl?: string
  gitBranch?: string
  gitCommitHash?: string
  uploadedAt: string
  updatedAt: string
  notes?: string
  storageType: 'supabase' | 'git' | 'local'
}

export interface GitCommitItem {
  hash: string
  message: string
  author: string
  date: string
  url?: string
}

export interface GitSyncConfig {
  repoUrl: string
  branch: string
  token?: string
  connected: boolean
  lastSync?: string
}

export interface SupabaseConfig {
  url: string
  anonKey: string
  bucketName: string
  connected: boolean
}
