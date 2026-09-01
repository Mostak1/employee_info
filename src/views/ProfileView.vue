<script setup>
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const error = ref('')

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
])

function displayValue(value) {
  return value || 'Not provided'
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

onMounted(loadProfile)
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

    <div v-else-if="loading" class="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Card class="animate-pulse"><CardContent class="h-64 p-6" /></Card>
      <Card class="animate-pulse"><CardContent class="h-64 p-6" /></Card>
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
  </section>
</template>
