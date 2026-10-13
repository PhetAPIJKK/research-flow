import { ref } from 'vue'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const useSupabaseSync = () => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = ref<string>('')
  const supabaseKey = ref<string>('')
  const bucketName = ref<string>('research-papers')
  const isConnected = ref<boolean>(false)
  const isTesting = ref<boolean>(false)
  const lastError = ref<string | null>(null)

  let client: SupabaseClient | null = null

  // Init credentials from runtimeConfig or localStorage
  const initConfig = () => {
    if (typeof window === 'undefined') return

    const savedUrl = localStorage.getItem('supabase_url') || (config.public.supabaseUrl as string) || ''
    const savedKey = localStorage.getItem('supabase_anon_key') || (config.public.supabaseAnonKey as string) || ''
    const savedBucket = localStorage.getItem('supabase_bucket') || 'research-papers'

    supabaseUrl.value = savedUrl
    supabaseKey.value = savedKey
    bucketName.value = savedBucket

    if (savedUrl && savedKey) {
      try {
        client = createClient(savedUrl, savedKey)
        isConnected.value = true
      } catch (err: any) {
        isConnected.value = false
        lastError.value = err.message
      }
    }
  }

  const saveConfig = (url: string, key: string, bucket: string = 'research-papers') => {
    supabaseUrl.value = url.trim()
    supabaseKey.value = key.trim()
    bucketName.value = bucket.trim()

    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_url', supabaseUrl.value)
      localStorage.setItem('supabase_anon_key', supabaseKey.value)
      localStorage.setItem('supabase_bucket', bucketName.value)
    }

    if (supabaseUrl.value && supabaseKey.value) {
      try {
        client = createClient(supabaseUrl.value, supabaseKey.value)
        isConnected.value = true
        lastError.value = null
      } catch (err: any) {
        isConnected.value = false
        lastError.value = err.message
      }
    } else {
      client = null
      isConnected.value = false
    }
  }

  const testConnection = async (): Promise<boolean> => {
    if (!supabaseUrl.value || !supabaseKey.value) {
      lastError.value = 'กรุณาระบุ Supabase URL และ Anon Key'
      return false
    }

    isTesting.value = true
    lastError.value = null
    try {
      client = createClient(supabaseUrl.value, supabaseKey.value)
      // Test querying auth or storage bucket list
      const { data, error } = await client.storage.listBuckets()
      if (error && error.message.includes('FetchError')) {
        throw error
      }
      isConnected.value = true
      return true
    } catch (err: any) {
      lastError.value = err.message || 'ไม่สามารถเชื่อมต่อ Supabase ได้'
      isConnected.value = false
      return false
    } finally {
      isTesting.value = false
    }
  }

  // Upload file to Supabase Storage or mock if in local mode
  const uploadFile = async (file: File): Promise<{ url: string; path: string }> => {
    if (client && isConnected.value) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `papers/${fileName}`

        const { data, error } = await client.storage
          .from(bucketName.value)
          .upload(filePath, file)

        if (error) throw error

        const { data: publicUrlData } = client.storage
          .from(bucketName.value)
          .getPublicUrl(filePath)

        return {
          url: publicUrlData.publicUrl,
          path: filePath
        }
      } catch (err: any) {
        console.warn('Supabase upload error, falling back to local object URL:', err)
      }
    }

    // Fallback: create browser object URL
    const localUrl = URL.createObjectURL(file)
    return {
      url: localUrl,
      path: `local/${file.name}`
    }
  }

  return {
    supabaseUrl,
    supabaseKey,
    bucketName,
    isConnected,
    isTesting,
    lastError,
    initConfig,
    saveConfig,
    testConnection,
    uploadFile
  }
}
