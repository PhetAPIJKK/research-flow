import { ref } from 'vue'
import type { GitCommitItem, GitSyncConfig } from '~/types/research'

const SAMPLE_COMMITS: GitCommitItem[] = [
  {
    hash: '9a8b7c4',
    message: 'feat(method): integrate tensor pruning pipeline for evaluation',
    author: 'Apinan J.',
    date: '2026-10-12 14:22',
    url: 'https://github.com/'
  },
  {
    hash: '8f7e6d5',
    message: 'docs(paper): update methodology section & system diagram',
    author: 'Apinan J.',
    date: '2026-10-10 17:40',
    url: 'https://github.com/'
  },
  {
    hash: '3c2b1a0',
    message: 'exp(dataset): add benchmark preprocessing script for edge testbed',
    author: 'Research Team',
    date: '2026-10-08 11:15',
    url: 'https://github.com/'
  },
  {
    hash: '5d4c3b2',
    message: 'refactor(survey): synthesize comparative literature matrix',
    author: 'Apinan J.',
    date: '2026-09-28 09:30',
    url: 'https://github.com/'
  }
]

export const useGitSync = () => {
  const config = useRuntimeConfig()

  const repoUrl = ref<string>('https://github.com/PhetAPIJKK/research-flow')
  const branch = ref<string>('main')
  const githubToken = ref<string>('')
  const isConnected = ref<boolean>(true)
  const isSyncing = ref<boolean>(false)
  const lastSyncTime = ref<string>('2026-10-12 14:30')
  const commits = ref<GitCommitItem[]>(SAMPLE_COMMITS)
  const syncError = ref<string | null>(null)

  const initGitConfig = () => {
    if (typeof window === 'undefined') return
    const savedRepo = localStorage.getItem('git_repo_url') || (config.public.gitRepoUrl as string)
    const savedBranch = localStorage.getItem('git_branch') || 'main'
    const savedToken = localStorage.getItem('git_token') || ''
    const savedCommits = localStorage.getItem('git_commits')
    const savedSyncTime = localStorage.getItem('git_last_sync')

    if (savedRepo) repoUrl.value = savedRepo
    if (savedBranch) branch.value = savedBranch
    if (savedToken) githubToken.value = savedToken
    if (savedSyncTime) lastSyncTime.value = savedSyncTime
    if (savedCommits) {
      try {
        commits.value = JSON.parse(savedCommits)
      } catch (e) {
        commits.value = SAMPLE_COMMITS
      }
    }
  }

  const saveGitConfig = (url: string, targetBranch: string, token: string = '') => {
    repoUrl.value = url.trim()
    branch.value = targetBranch.trim() || 'main'
    githubToken.value = token.trim()

    if (typeof window !== 'undefined') {
      localStorage.setItem('git_repo_url', repoUrl.value)
      localStorage.setItem('git_branch', branch.value)
      localStorage.setItem('git_token', githubToken.value)
    }

    if (repoUrl.value) {
      isConnected.value = true
    }
  }

  // Fetch real commits from GitHub API if repository matches github.com/owner/repo
  const syncWithRemote = async () => {
    if (!repoUrl.value) {
      syncError.value = 'กรุณาระบุ URL ของ Git Repository'
      return
    }

    isSyncing.value = true
    syncError.value = null

    try {
      // Parse owner/repo if GitHub
      const match = repoUrl.value.match(/github\.com\/([^\/]+)\/([^\/\.]+)/)
      if (match) {
        const owner = match[1]
        const repo = match[2]
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json'
        }
        if (githubToken.value) {
          headers['Authorization'] = `token ${githubToken.value}`
        }

        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch.value}&per_page=8`, {
          headers
        })

        if (res.ok) {
          const data = await res.json()
          commits.value = data.map((item: any) => ({
            hash: item.sha.substring(0, 7),
            message: item.commit.message.split('\n')[0],
            author: item.commit.author.name,
            date: new Date(item.commit.author.date).toISOString().replace('T', ' ').substring(0, 16),
            url: item.html_url
          }))
          if (typeof window !== 'undefined') {
            localStorage.setItem('git_commits', JSON.stringify(commits.value))
          }
        } else if (res.status === 404) {
          // Repo is private or doesn't exist, keep sample with notification
          syncError.value = 'ไม่พบคลังข้อมูล หรือเป็น Private Repository (สามารถระบุ Personal Access Token เพื่อเข้าถึงได้)'
        }
      }
      
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16)
      lastSyncTime.value = nowStr
      if (typeof window !== 'undefined') {
        localStorage.setItem('git_last_sync', nowStr)
      }
    } catch (err: any) {
      console.warn('Git sync fetch failed:', err)
      syncError.value = 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Git: ' + err.message
    } finally {
      isSyncing.value = false
    }
  }

  // Add manual commit log record (e.g. for Overleaf or local git)
  const addManualCommit = (message: string, hash?: string) => {
    const newCommit: GitCommitItem = {
      hash: hash || Math.random().toString(16).substring(2, 9),
      message,
      author: 'You (Researcher)',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      url: repoUrl.value ? `${repoUrl.value}/commit/${hash || ''}` : undefined
    }
    commits.value.unshift(newCommit)
    if (typeof window !== 'undefined') {
      localStorage.setItem('git_commits', JSON.stringify(commits.value))
    }
  }

  return {
    repoUrl,
    branch,
    githubToken,
    isConnected,
    isSyncing,
    lastSyncTime,
    commits,
    syncError,
    initGitConfig,
    saveGitConfig,
    syncWithRemote,
    addManualCommit
  }
}
