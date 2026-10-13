<script setup lang="ts">
import { ref } from 'vue'
import {
  FileText,
  GitBranch,
  Layers,
  Settings,
  Database,
  Menu,
  X,
  ExternalLink,
  Plus
} from 'lucide-vue-next'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navLinks = [
  { name: 'ภาพรวม', nameEn: 'Overview', to: '/', icon: Layers },
  { name: 'ขั้นตอนการวิจัย', nameEn: 'Workflow', to: '/workflow', icon: FileText },
  { name: 'คลังเปเปอร์', nameEn: 'Papers', to: '/papers', icon: FileText },
  { name: 'Git & Repository', nameEn: 'Git Sync', to: '/git-sync', icon: GitBranch },
  { name: 'การเชื่อมต่อ & ตั้งค่า', nameEn: 'Settings', to: '/settings', icon: Settings }
]
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Branding -->
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-zinc-800 transition-colors">
              RF
            </div>
            <div>
              <div class="text-base font-semibold text-zinc-900 leading-tight">Research Flow</div>
              <div class="text-xs text-zinc-500 font-normal">ระบบติดตามขั้นตอนวิจัย</div>
            </div>
          </NuxtLink>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navLinks"
              :key="item.to"
              :to="item.to"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              :class="route.path === item.to 
                ? 'bg-zinc-100 text-zinc-900 font-semibold' 
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'"
            >
              <span>{{ item.name }}</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Right Side: Status Badges & Quick Action -->
        <div class="hidden sm:flex items-center gap-3">
          <NuxtLink
            to="/git-sync"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
            title="Git Connection Status"
          >
            <GitBranch class="w-3.5 h-3.5 text-zinc-700" />
            <span>Git Active</span>
          </NuxtLink>

          <NuxtLink
            to="/settings"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
            title="Supabase Storage Ready"
          >
            <Database class="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Ready</span>
          </NuxtLink>

          <NuxtLink
            to="/papers?new=1"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm ml-2"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>อัปโหลดงานวิจัย</span>
          </NuxtLink>
        </div>

        <!-- Mobile Menu Toggle Button -->
        <div class="flex md:hidden">
          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          >
            <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div v-if="mobileMenuOpen" class="md:hidden border-b border-zinc-200 bg-white px-4 pt-2 pb-4 space-y-1">
      <NuxtLink
        v-for="item in navLinks"
        :key="item.to"
        :to="item.to"
        @click="mobileMenuOpen = false"
        class="block px-3 py-2 rounded-md text-sm font-medium"
        :class="route.path === item.to 
          ? 'bg-zinc-100 text-zinc-900 font-semibold' 
          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'"
      >
        {{ item.name }} ({{ item.nameEn }})
      </NuxtLink>

      <div class="pt-3 border-t border-zinc-100 flex items-center justify-between">
        <NuxtLink
          to="/papers?new=1"
          @click="mobileMenuOpen = false"
          class="w-full text-center px-3 py-2 rounded-md bg-zinc-900 text-white text-sm font-medium"
        >
          + อัปโหลดงานวิจัย / Paper
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
