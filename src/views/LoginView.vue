<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Eye, EyeOff } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const brandLogoUrl = `${import.meta.env.BASE_URL}awc.png`
const form = reactive({ username: '', password: '' })
const showPassword = ref(false)

async function submit() {
  if (await auth.login(form)) {
    toast.success('Welcome back', { description: 'You are now signed in to AWC Employee App.' })
    await router.replace(getPostLoginDestination())
  } else {
    toast.error('Sign in failed', { description: auth.error })
  }
}

function getPostLoginDestination() {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return { name: 'todos' }
  }

  const destination = router.resolve(redirect)
  const isKnownRoute = destination.matched.length > 0
  const isLoginRoute = destination.name === 'login'
    || destination.matched.some((matchedRoute) => matchedRoute.meta.guest)

  if (!isKnownRoute || isLoginRoute) return { name: 'todos' }
  return { path: destination.fullPath }
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
    <Card class="w-full max-w-md border-slate-200 shadow-sm">
      <CardHeader class="space-y-4 pb-5">
        <span class="grid size-12 place-items-center rounded-2xl bg-teal-50 p-1.5 ring-1 ring-teal-100">
          <img :src="brandLogoUrl" alt="" aria-hidden="true" class="h-full w-full object-contain" />
        </span>
        <div class="space-y-2">
          <p class="text-sm font-semibold uppercase tracking-wider text-teal-700">AWC Employee App</p>
          <CardTitle class="text-3xl tracking-tight">Welcome back</CardTitle>
          <CardDescription>Sign in to view your tasks and attendance.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form class="space-y-5" @submit.prevent="submit">
          <label class="block space-y-2 text-sm font-medium text-slate-700">Username
            <Input v-model="form.username" required autocomplete="username" />
          </label>
          <label class="block space-y-2 text-sm font-medium text-slate-700">Password
            <InputGroup>
              <InputGroupInput v-model="form.password" required :type="showPassword ? 'text' : 'password'" autocomplete="current-password" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :title="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </label>
          <Button type="submit" size="lg" :disabled="auth.loading" class="h-11 w-full flex items-center justify-center gap-2">
            <Spinner v-if="auth.loading" class="size-4" />
            <span>{{ auth.loading ? 'Signing in…' : 'Sign in' }}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
