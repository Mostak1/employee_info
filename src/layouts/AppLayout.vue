<script setup>
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const links = [
  { name: 'today', label: 'Today', icon: '⌂' },
  { name: 'attendance', label: 'Attendance', icon: '▣' },
  { name: 'profile', label: 'Profile', icon: '○' },
]

async function signOut() {
  await auth.logout()
  toast.success('Signed out', { description: 'Your Carenet HRM session has ended.' })
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-20 text-slate-900 md:pb-0">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <RouterLink to="/today" class="flex items-center gap-3">
          <span class="grid size-9 place-items-center rounded-xl bg-teal-700 font-bold text-white">C</span>
          <span><strong class="block text-sm">Carenet HRM</strong><small class="block text-xs text-slate-500">Employee self-service</small></span>
        </RouterLink>
        <div class="flex items-center gap-3 text-right">
          <span class="hidden text-sm sm:block">{{ auth.user?.name || 'Employee' }}</span>
          <Button variant="ghost" size="icon" title="Sign out" @click="signOut">↪</Button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8"><RouterView /></main>

    <nav class="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white md:static md:mx-auto md:max-w-5xl md:border-0 md:bg-transparent">
      <div class="mx-auto grid max-w-5xl grid-cols-3 px-4 py-2 md:flex md:justify-start md:gap-2 md:px-6 md:py-0">
        <RouterLink v-for="link in links" :key="link.name" :to="{ name: link.name }" class="flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium text-slate-500 hover:bg-teal-50 hover:text-teal-700 md:flex-row md:text-sm" :class="route.name === link.name ? 'bg-teal-50 text-teal-700' : ''">
          <span class="text-base">{{ link.icon }}</span>{{ link.label }}
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
