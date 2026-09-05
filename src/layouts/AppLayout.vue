<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogOut, UserRound } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const links = [
  { name: 'attendance', label: 'Attendance', icon: '▣' },
  { name: 'todos', label: 'To Do', icon: '✓' },
  { name: 'profile', label: 'Profile', icon: '○' },
]

const initials = computed(() => {
  const name = auth.user?.name || auth.user?.username || 'Employee'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})

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
        <RouterLink to="/todos" class="flex items-center gap-3">
          <span class="grid size-12 place-items-center rounded-xl bg-teal-700 font-bold text-white">AWC</span>
          <span><strong class="block text-sm">AWC HRM</strong></span>
        </RouterLink>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full p-1 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              aria-label="Open account menu"
            >
              <span class="hidden max-w-40 truncate text-sm font-medium text-slate-700 sm:block">{{ auth.user?.name || 'Employee' }}</span>
              <Avatar class="size-9 ring-2 ring-white">
                <AvatarImage v-if="auth.user?.profile_photo" :src="auth.user.profile_photo" :alt="`${auth.user?.name || 'Employee'} profile photo`" />
                <AvatarFallback>{{ initials }}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>
              <p class="truncate">{{ auth.user?.name || 'Employee' }}</p>
              <p class="mt-0.5 truncate text-xs font-normal text-slate-500">{{ auth.user?.username || auth.user?.email || 'Signed in employee' }}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="router.push({ name: 'profile' })">
              <UserRound class="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem class="text-red-600 focus:bg-red-50 focus:text-red-700" @select="signOut">
              <LogOut class="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
