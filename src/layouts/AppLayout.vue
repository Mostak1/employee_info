<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarCheck, FileText, ListTodo, LogOut, Send, UserRound } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const links = [
  { name: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { name: 'requests', label: 'Requests', icon: Send },
  { name: 'todos', label: 'To Do', icon: ListTodo },
  { name: 'profile', label: 'Profile', icon: UserRound },
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
  <div class="min-h-screen bg-slate-50 pb-24 text-slate-900">
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <RouterLink to="/todos" class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-xl bg-teal-700 font-bold text-white shadow-xs">AWC</span>
          <span><strong class="block text-sm">AWC HRM</strong></span>
        </RouterLink>

        <!-- Desktop Header Nav -->
        <nav class="hidden items-center gap-1 rounded-full bg-slate-100 p-1 md:flex">
          <RouterLink
            v-for="link in links"
            :key="link.name"
            :to="{ name: link.name }"
            class="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:text-teal-800"
            :class="route.name === link.name ? 'bg-white text-teal-800 font-semibold shadow-xs' : ''"
          >
            <component :is="link.icon" class="size-4 shrink-0" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </nav>

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

    <!-- Bottom Footer Navigation Dock (Visible on Mobile & Desktop) -->
    <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div class="mx-auto flex max-w-5xl items-center justify-around px-4 py-2 sm:px-6">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          class="flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700 sm:flex-row sm:gap-2 sm:px-6 sm:py-2 sm:text-sm"
          :class="route.name === link.name ? 'bg-teal-50 text-teal-700 font-semibold' : ''"
        >
          <component :is="link.icon" class="size-5 shrink-0" />
          <span>{{ link.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
