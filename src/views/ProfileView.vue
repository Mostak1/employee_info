<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { runtimeRequest } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const error = ref('')
const requestLoading = ref(true)
const requestError = ref('')
const requestOpen = ref(false)
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')
const pendingRequest = ref(null)

const profile = computed(() => auth.user || {})
const initials = computed(() => {
  const name = profile.value.name || profile.value.username || 'Employee'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})

const details = computed(() => [
  { label: 'Username', value: profile.value.username },
  { label: 'Email', value: profile.value.email },
  { label: 'Employee ID', value: profile.value.employee_id },
  { label: 'Contact number', value: profile.value.contact_number },
  { label: 'Department', value: profile.value.department },
  { label: 'Designation', value: profile.value.designation },
  { label: 'Current address', value: profile.value.current_address },
  { label: 'Permanent address', value: profile.value.permanent_address },
])

const form = reactive({
  surname: '',
  first_name: '',
  last_name: '',
  email: '',
  contact_number: '',
  current_address: '',
  permanent_address: '',
})

function displayValue(value) {
  return value || 'Not provided'
}

function syncForm() {
  for (const field of Object.keys(form)) form[field] = profile.value[field] || ''
  submitError.value = ''
}

function openRequestForm() {
  syncForm()
  submitSuccess.value = ''
  requestOpen.value = true
}

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    await auth.fetchCurrentUser()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Unable to load your profile.'
  } finally {
    loading.value = false
  }
}

async function loadRequest() {
  requestLoading.value = true
  requestError.value = ''
  try {
    const { data } = await runtimeRequest('get', 'profileUpdateRequest')
    pendingRequest.value = data.request || null
  } catch (requestException) {
    requestError.value = requestException.response?.data?.message || 'Unable to load your profile request status.'
  } finally {
    requestLoading.value = false
  }
}

async function submitRequest() {
  submitting.value = true
  submitError.value = ''
  submitSuccess.value = ''
  try {
    const { data } = await runtimeRequest('post', 'profileUpdateRequest', { data: { ...form } })
    pendingRequest.value = data.request || null
    requestOpen.value = false
    submitSuccess.value = data.message || 'Your profile update request has been submitted for review.'
  } catch (requestException) {
    const validation = requestException.response?.data?.errors
    submitError.value = validation
      ? Object.values(validation).flat().join(' ')
      : requestException.response?.data?.message || 'Unable to submit your profile update request.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadProfile()
  loadRequest()
})
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-teal-700">Account</p>
        <h1 class="mt-1 text-3xl font-bold">Profile</h1>
        <p class="mt-1 text-sm text-slate-500">Your employee information</p>
      </div>
      <Button v-if="error" variant="outline" @click="loadProfile">Try again</Button>
    </div>

    <Card v-if="error" class="mt-6 border-red-200 bg-red-50">
      <CardContent class="p-5 text-sm text-red-700">{{ error }}</CardContent>
    </Card>

    <div v-else-if="loading" class="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" role="status" aria-live="polite" aria-label="Loading profile">
      <Card>
        <CardContent class="flex flex-col items-center p-6">
          <Skeleton class="size-24 rounded-full" />
          <Skeleton class="mt-4 h-5 w-36" />
          <Skeleton class="mt-2 h-4 w-24" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton class="h-5 w-36" /></CardHeader>
        <CardContent class="grid gap-x-6 gap-y-6 sm:grid-cols-2">
          <div v-for="item in 8" :key="item" class="grid gap-2">
            <Skeleton class="h-3 w-24" />
            <Skeleton class="h-4 w-40 max-w-full" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-else class="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Card>
        <CardContent class="flex flex-col items-center p-6 text-center">
          <img
            v-if="profile.profile_photo"
            :src="profile.profile_photo"
            :alt="`${displayValue(profile.name)} profile photo`"
            class="size-24 rounded-full object-cover ring-4 ring-teal-50"
          >
          <div v-else class="grid size-24 place-items-center rounded-full bg-teal-700 text-2xl font-bold text-white ring-4 ring-teal-50">
            {{ initials }}
          </div>
          <h2 class="mt-4 text-xl font-semibold text-slate-900">{{ displayValue(profile.name) }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ displayValue(profile.designation) }}</p>
          <Button class="mt-5 w-full" :disabled="requestLoading" @click="openRequestForm">
            {{ pendingRequest ? 'Update request pending' : 'Request profile update' }}
          </Button>
          <p v-if="requestLoading" class="mt-2 text-xs text-slate-500">Checking request status…</p>
          <p v-else-if="requestError" class="mt-2 text-xs text-red-600">{{ requestError }}</p>
          <p v-else-if="pendingRequest" class="mt-2 text-xs text-amber-700">Your latest changes are waiting for ERP approval.</p>
          <p v-if="submitSuccess" class="mt-3 text-xs text-emerald-700">{{ submitSuccess }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Employee details</CardTitle></CardHeader>
        <CardContent class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div v-for="detail in details" :key="detail.label">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ detail.label }}</p>
            <p class="mt-1 break-words text-sm font-medium text-slate-900">{{ displayValue(detail.value) }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="requestOpen">
      <DialogContent class="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request profile update</DialogTitle>
          <DialogDescription>Submit personal information changes for ERP review.</DialogDescription>
        </DialogHeader>

        <form class="grid gap-4" @submit.prevent="submitRequest">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-2 text-sm font-medium">Prefix
              <Input v-model="form.surname" maxlength="10" autocomplete="honorific-prefix" />
            </label>
            <label class="grid gap-2 text-sm font-medium">First name
              <Input v-model="form.first_name" required autocomplete="given-name" />
            </label>
          </div>
          <label class="grid gap-2 text-sm font-medium">Last name
            <Input v-model="form.last_name" autocomplete="family-name" />
          </label>
          <label class="grid gap-2 text-sm font-medium">Email
            <Input v-model="form.email" type="email" autocomplete="email" />
          </label>
          <label class="grid gap-2 text-sm font-medium">Contact number
            <Input v-model="form.contact_number" autocomplete="tel" />
          </label>
          <label class="grid gap-2 text-sm font-medium">Current address
            <Textarea v-model="form.current_address" rows="3" />
          </label>
          <label class="grid gap-2 text-sm font-medium">Permanent address
            <Textarea v-model="form.permanent_address" rows="3" />
          </label>

          <p v-if="submitError" class="rounded-md bg-red-50 p-3 text-sm text-red-700">{{ submitError }}</p>
          <DialogFooter>
            <Button type="button" variant="outline" :disabled="submitting" @click="requestOpen = false">Cancel</Button>
            <Button type="submit" :disabled="submitting">{{ submitting ? 'Submitting…' : 'Submit request' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
