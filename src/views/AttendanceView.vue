<script setup>
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import api from '../lib/api'

const loading = ref(true)
const error = ref('')
const validationError = ref('')
const period = ref(null)
const summary = ref({ total_days: 0, present_days: 0, late_days: 0, absent_days: 0 })
const attendance = ref([])
const dateRange = ref(getCurrentMonthRange())
const filterOpen = ref(false)

const periodLabel = computed(() => {
  if (!period.value) return 'Current month'
  const start = formatDate(period.value.start_date)
  const end = formatDate(period.value.end_date)
  return start === end ? start : `${start} – ${end}`
})

const summaryCards = computed(() => [
  { label: 'Total days', value: summary.value.total_days, tone: 'bg-blue-600' },
  { label: 'Present', value: summary.value.present_days, tone: 'bg-emerald-600' },
  { label: 'Late', value: summary.value.late_days, tone: 'bg-amber-500' },
  { label: 'Absent', value: summary.value.absent_days, tone: 'bg-red-600' },
])

function getCurrentMonthRange() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, today.getMonth() + 1, 0).getDate()
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

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

function statusLabel(status) {
  return (status || 'unknown').replaceAll('_', ' ')
}

async function loadAttendance() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/attendance', {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
      },
    })
    period.value = data.period || null
    if (data.period?.start_date && data.period?.end_date) {
      dateRange.value = { start: data.period.start_date, end: data.period.end_date }
    }
    summary.value = { ...summary.value, ...(data.summary || {}) }
    attendance.value = data.attendance || []
    return true
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Unable to load your attendance.'
    return false
  } finally {
    loading.value = false
  }
}

async function applyFilter() {
  validationError.value = ''
  if (!dateRange.value.start || !dateRange.value.end) {
    validationError.value = 'Select both a start date and an end date.'
    return
  }
  if (dateRange.value.start > dateRange.value.end) {
    validationError.value = 'The start date must be before or equal to the end date.'
    return
  }
  if (await loadAttendance()) filterOpen.value = false
}

async function resetFilter() {
  dateRange.value = getCurrentMonthRange()
  validationError.value = ''
  if (await loadAttendance()) filterOpen.value = false
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
      <div class="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          :aria-expanded="filterOpen"
          aria-controls="attendance-filter"
          @click="filterOpen = !filterOpen"
        >
          Filter <span aria-hidden="true" class="text-xs">{{ filterOpen ? '▲' : '▼' }}</span>
        </Button>
        <Button v-if="error" variant="outline" size="sm" @click="loadAttendance">Try again</Button>
      </div>
    </div>

    <Sheet v-model:open="filterOpen">
      <SheetContent id="attendance-filter" side="bottom" class="mx-auto max-h-[90vh] max-w-2xl rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Filter attendance</SheetTitle>
          <SheetDescription>Select an inclusive start and end date.</SheetDescription>
        </SheetHeader>
        <form class="grid gap-4" @submit.prevent="applyFilter">
          <label class="grid gap-2 text-sm font-medium text-slate-700">
            <span>Start date</span>
            <Input v-model="dateRange.start" type="date" :aria-invalid="Boolean(validationError)" />
          </label>
          <label class="grid gap-2 text-sm font-medium text-slate-700">
            <span>End date</span>
            <Input v-model="dateRange.end" type="date" :aria-invalid="Boolean(validationError)" />
          </label>
          <p v-if="validationError" class="text-sm text-red-600">{{ validationError }}</p>
          <SheetFooter class="mt-2 sm:justify-stretch">
            <Button type="submit" class="flex-1" :disabled="loading">Apply</Button>
            <Button type="button" variant="outline" class="flex-1" :disabled="loading" @click="resetFilter">Reset</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <Card v-if="error" class="mt-6 border-red-200 bg-red-50">
      <CardContent class="p-5 text-sm text-red-700">{{ error }}</CardContent>
    </Card>

    <div v-else-if="loading" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="item in 4" :key="item" class="animate-pulse"><CardContent class="h-24 p-5" /></Card>
    </div>

    <template v-else>
      <div class="mt-6 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card v-for="item in summaryCards" :key="item.label" :class="['overflow-hidden border-0 text-white', item.tone]">
          <CardContent class="p-0">
            <div class="flex min-h-[76px] flex-col items-center justify-center px-2 py-2 text-center sm:min-h-[96px] sm:px-5 sm:py-4">
              <p class="text-[10px] font-medium leading-tight text-white/80 sm:text-sm">{{ item.label }}</p>
              <p class="mt-0.5 text-xl font-bold leading-none sm:mt-1 sm:text-3xl">{{ item.value }}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card class="mt-6">
        <CardHeader><CardTitle>Daily records</CardTitle></CardHeader>
        <CardContent class="p-0">
          <div v-if="attendance.length === 0" class="px-6 py-8 text-center text-sm text-slate-500">
            No attendance records found for this date range.
          </div>
          <div v-else>
            <div class="space-y-3 p-4 md:hidden">
              <Card v-for="day in attendance" :key="day.date" class="shadow-none">
                <CardContent class="p-4">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-semibold text-slate-800">{{ formatDate(day.date) }}</p>
                    <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold capitalize', statusClass(day.status)]">{{ statusLabel(day.status) }}</span>
                  </div>
                  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><p class="text-xs text-slate-500">Clock in</p><p class="mt-1 font-medium text-slate-700">{{ formatTime(day.clock_in) }}</p></div>
                    <div><p class="text-xs text-slate-500">Clock out</p><p class="mt-1 font-medium text-slate-700">{{ formatTime(day.clock_out) }}</p></div>
                    <div><p class="text-xs text-slate-500">Late</p><p class="mt-1 font-medium text-slate-700">{{ day.late_minutes ? `${day.late_minutes} min` : '—' }}</p></div>
                    <div><p class="text-xs text-slate-500">Worked hours</p><p class="mt-1 font-medium text-slate-700">{{ day.worked_hours || '—' }}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div class="hidden overflow-x-auto md:block">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead class="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th class="px-6 py-3 font-medium">Date</th><th class="px-6 py-3 font-medium">Status</th><th class="px-6 py-3 font-medium">Clock in</th><th class="px-6 py-3 font-medium">Clock out</th><th class="px-6 py-3 text-right font-medium">Hours</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="day in attendance" :key="day.date" class="hover:bg-slate-50">
                  <td class="px-6 py-4 font-medium text-slate-800">{{ formatDate(day.date) }}</td>
                  <td class="px-6 py-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-semibold capitalize', statusClass(day.status)]">{{ statusLabel(day.status) }}</span></td>
                  <td class="px-6 py-4 text-slate-600">{{ formatTime(day.clock_in) }}</td>
                  <td class="px-6 py-4 text-slate-600">{{ formatTime(day.clock_out) }}</td>
                  <td class="px-6 py-4 text-right text-slate-600">{{ day.worked_hours || '—' }}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
