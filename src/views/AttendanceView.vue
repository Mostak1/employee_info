<script setup>
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '../lib/api'

const loading = ref(true)
const error = ref('')
const period = ref(null)
const summary = ref({ total_days: 0, present_days: 0, late_days: 0, absent_days: 0 })
const attendance = ref([])

const periodLabel = computed(() => {
  if (!period.value) return 'Current month'
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(period.value.year, period.value.month - 1, 1),
  )
})

const summaryCards = computed(() => [
  { label: 'Total days', value: summary.value.total_days, tone: 'bg-blue-600' },
  { label: 'Present', value: summary.value.present_days, tone: 'bg-emerald-600' },
  { label: 'Late', value: summary.value.late_days, tone: 'bg-amber-500' },
  { label: 'Absent', value: summary.value.absent_days, tone: 'bg-red-600' },
])

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  )
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
}

function statusClass(status) {
  return {
    present: 'bg-emerald-100 text-emerald-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
    leave: 'bg-violet-100 text-violet-700',
    unpaid_leave: 'bg-orange-100 text-orange-700',
    holiday: 'bg-sky-100 text-sky-700',
    weekend: 'bg-slate-100 text-slate-600',
    exchange: 'bg-cyan-100 text-cyan-700',
  }[status] || 'bg-slate-100 text-slate-600'
}

async function loadAttendance() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/attendance/current-month')
    period.value = data.period || null
    summary.value = { ...summary.value, ...(data.summary || {}) }
    attendance.value = data.attendance || []
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Unable to load your attendance.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAttendance)
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-teal-700">History</p>
        <h1 class="mt-1 text-3xl font-bold">Attendance</h1>
        <p class="mt-1 text-sm text-slate-500">{{ periodLabel }}</p>
      </div>
      <Button v-if="error" variant="outline" @click="loadAttendance">Try again</Button>
    </div>

    <Card v-if="error" class="mt-6 border-red-200 bg-red-50">
      <CardContent class="p-5 text-sm text-red-700">{{ error }}</CardContent>
    </Card>

    <div v-else-if="loading" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="item in 4" :key="item" class="animate-pulse"><CardContent class="h-24 p-5" /></Card>
    </div>

    <template v-else>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card v-for="item in summaryCards" :key="item.label" class="overflow-hidden">
          <CardContent class="p-0">
            <div :class="['h-full px-5 py-4 text-white', item.tone]">
              <p class="text-sm font-medium text-white/80">{{ item.label }}</p>
              <p class="mt-1 text-3xl font-bold">{{ item.value }}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card class="mt-6">
        <CardHeader><CardTitle>Daily records</CardTitle></CardHeader>
        <CardContent class="p-0">
          <div v-if="attendance.length === 0" class="px-6 py-8 text-center text-sm text-slate-500">
            No attendance records found for this month.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead class="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th class="px-6 py-3 font-medium">Date</th><th class="px-6 py-3 font-medium">Status</th><th class="px-6 py-3 font-medium">Clock in</th><th class="px-6 py-3 font-medium">Clock out</th><th class="px-6 py-3 text-right font-medium">Hours</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="day in attendance" :key="day.date" class="hover:bg-slate-50">
                  <td class="px-6 py-4 font-medium text-slate-800">{{ formatDate(day.date) }}</td>
                  <td class="px-6 py-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-semibold capitalize', statusClass(day.status)]">{{ day.status.replace('_', ' ') }}</span></td>
                  <td class="px-6 py-4 text-slate-600">{{ formatTime(day.clock_in) }}</td>
                  <td class="px-6 py-4 text-slate-600">{{ formatTime(day.clock_out) }}</td>
                  <td class="px-6 py-4 text-right text-slate-600">{{ day.worked_hours || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
