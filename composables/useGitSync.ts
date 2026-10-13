import { ref } from 'vue'

const repoUrl = ref('')
const branch = ref('main')
const token = ref('')

export const useGitSync = () => {
  const config = useRuntimeConfig()

  const initGitConfig = () => {
    if (typeof window === 'undefined') return
    repoUrl.value = localStorage.getItem('git_repo_url') || (config.public.gitRepoUrl as string) || ''
    branch.value = localStorage.getItem('git_branch') || 'main'
    token.value = localStorage.getItem('git_token') || ''
  }

  const saveGitConfig = (url: string, b: string, t: string) => {
    repoUrl.value = url.trim()
    branch.value = b.trim() || 'main'
    token.value = t.trim()
    localStorage.setItem('git_repo_url', repoUrl.value)
    localStorage.setItem('git_branch', branch.value)
    localStorage.setItem('git_token', token.value)
  }

  return { repoUrl, branch, token, initGitConfig, saveGitConfig }
}
