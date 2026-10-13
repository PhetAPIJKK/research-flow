import { ref } from 'vue'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = ref('')
const key = ref('')
const bucket = ref('research-papers')
const connected = ref(false)
let client: SupabaseClient | null = null

export const useSupabaseSync = () => {
  const config = useRuntimeConfig()

  const build = () => {
    client = url.value && key.value ? createClient(url.value, key.value) : null
    connected.value = !!client
  }

  const initConfig = () => {
    if (typeof window === 'undefined') return
    url.value = localStorage.getItem('supabase_url') || (config.public.supabaseUrl as string) || ''
    key.value = localStorage.getItem('supabase_anon_key') || (config.public.supabaseAnonKey as string) || ''
    bucket.value = localStorage.getItem('supabase_bucket') || 'research-papers'
    build()
  }

  const saveConfig = (u: string, k: string, b: string) => {
    url.value = u.trim()
    key.value = k.trim()
    bucket.value = b.trim() || 'research-papers'
    localStorage.setItem('supabase_url', url.value)
    localStorage.setItem('supabase_anon_key', key.value)
    localStorage.setItem('supabase_bucket', bucket.value)
    build()
  }

  const testConnection = async (): Promise<string | null> => {
    if (!client) return 'กรุณากรอก URL และ Anon Key'
    const { error } = await client.storage.from(bucket.value).list('', { limit: 1 })
    return error ? error.message : null
  }

  // returns public URL, or null if not connected / failed (file is still kept locally)
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!client) return null
    const ext = file.name.split('.').pop()
    const path = `papers/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    const { error } = await client.storage.from(bucket.value).upload(path, file)
    if (error) return null
    return client.storage.from(bucket.value).getPublicUrl(path).data.publicUrl
  }

  return { url, key, bucket, connected, initConfig, saveConfig, testConnection, uploadFile }
}
