<script setup>
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { runtimeRequest } from '../lib/api'

const loading = ref(true)
const error = ref('')
const leaveBalanceLoading = ref(true)
const leaveBalanceError = ref('')
const casualLeaveRemaining = ref(0)
const holidaysLoading = ref(true)
const holidaysError = ref('')
const upcomingHolidays = ref([])
const rosterLoading = ref(true)
const rosterError = ref('')
const teamRoster = ref({ department: null, range: null, days: [], employees: [] })
const period = ref(null)
const summary = ref({ total_days: 0, present_days: 0, late_days: 0, absent_days: 0 })
const attendance = ref([])
const selectedPeriod = ref('this_month')
const dateRange = ref(getMonthRange('this_month'))
const filterOpen = ref(false)

const periodLabel = computed(() => {
  if (!period.value) return 'Current month'
  const start = formatDate(period.value.start_date)
  const end = formatDate(period.value.end_date)
  return start === end ? start : `${start} – ${end}`
})

const averageWorkingHours = computed(() => {
  const workingDays = attendance.value.filter((day) => {
    const isWorkingDay = day.status === 'present' || day.status === 'late'
    return isWorkingDay && Number.isFinite(Number(day.worked_hours))
  })

  if (workingDays.length === 0) return '0.00 hrs'

  const totalHours = workingDays.reduce((total, day) => total + Number(day.worked_hours), 0)
  return `${(totalHours / workingDays.length).toFixed(2)} hrs`
})

const summaryCards = computed(() => [
  { label: 'Total days', value: summary.value.total_days, tone: 'bg-blue-600' },
  { label: 'Present', value: summary.value.present_days, tone: 'bg-emerald-600' },
  { label: 'Late', value: summary.value.late_days, tone: 'bg-amber-500' },
  { label: 'Absent', value: summary.value.absent_days, tone: 'bg-red-600' },
  { label: 'Avg working hours', value: averageWorkingHours.value, tone: 'bg-violet-600' },
  {
    label: 'Casual leave left',
    value: leaveBalanceLoading.value ? '…' : leaveBalanceError.value ? '—' : `${casualLeaveRemaining.value} days`,
    tone: 'bg-cyan-700',
  },
])

function getMonthRange(periodKey) {
  const today = new Date()
  const monthOffset = periodKey === 'previous_month' ? -1 : 0
  const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = targetMonth.getFullYear()
  const monthNumber = targetMonth.getMonth() + 1
  const month = String(monthNumber).padStart(2, '0')
  const lastDay = new Date(year, monthNumber, 0).getDate()
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

function formatHolidayDates(holiday) {
  const start = formatDate(holiday.start_date)
  const end = formatDate(holiday.end_date)
  return start === end ? start : `${start} - ${end}`
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

function statusShortLabel(status) {
  return {
    present: 'P',
    weekend: 'W',
    leave: 'L',
    holiday: 'H',
    off: 'O',
  }[status] || 'O'
}

function rosterStatus(employee, date) {
  return employee.roster?.find((day) => day.date === date)?.status || 'off'
}

async function loadAttendance() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await runtimeRequest('get', 'attendance', {
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

async function loadCasualLeaveBalance() {
  leaveBalanceLoading.value = true
  leaveBalanceError.value = ''

  try {
    const { data } = await runtimeRequest('get', 'leaveBalance')
    const remainingLeave = Number(data.remaining_leave)
    casualLeaveRemaining.value = Number.isFinite(remainingLeave) ? Math.max(0, remainingLeave) : 0
  } catch (requestError) {
    leaveBalanceError.value = requestError.response?.data?.message || 'Unable to load your casual leave balance.'
  } finally {
    leaveBalanceLoading.value = false
  }
}

async function loadUpcomingHolidays() {
  holidaysLoading.value = true
  holidaysError.value = ''

  try {
    const { data } = await runtimeRequest('get', 'upcomingHolidays')
    upcomingHolidays.value = data.holidays || []
  } catch (requestError) {
    holidaysError.value = requestError.response?.data?.message || 'Unable to load upcoming holidays.'
  } finally {
    holidaysLoading.value = false
  }
}

async function loadTeamRoster() {
  rosterLoading.value = true
  rosterError.value = ''

  try {
    const { data } = await runtimeRequest('get', 'teamRoster')
    teamRoster.value = {
      department: data.department || null,
      range: data.range || null,
      days: data.days || [],
      employees: data.employees || [],
    }
  } catch (requestError) {
    rosterError.value = requestError.response?.data?.message || 'Unable to load your team roster.'
  } finally {
    rosterLoading.value = false
  }
}

async function applyFilter() {
  dateRange.value = getMonthRange(selectedPeriod.value)
  if (await loadAttendance()) filterOpen.value = false
}

async function resetFilter() {
  selectedPeriod.value = 'this_month'
  dateRange.value = getMonthRange('this_month')
  if (await loadAttendance()) filterOpen.value = false
}

onMounted(() => {
  loadAttendance()
  loadCasualLeaveBalance()
  loadUpcomingHolidays()
  loadTeamRoster()
})
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
          <SheetDescription>Select a month to view attendance.</SheetDescription>
        </SheetHeader>
        <form class="grid gap-4" @submit.prevent="applyFilter">
          <label class="grid gap-2 text-sm font-medium text-slate-700">
            <span>Month</span>
            <Select v-model="selectedPeriod">
              <SelectTrigger aria-label="Select attendance month">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent :portal="false">
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="previous_month">Previous month</SelectItem>
              </SelectContent>
            </Select>
          </label>
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

    <div v-else-if="loading" class="mt-6" role="status" aria-live="polite" aria-label="Loading attendance">
      <div class="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-6">
        <Card v-for="item in 6" :key="item" class="gap-0 overflow-hidden border-0 py-0">
          <CardContent class="flex min-h-[84px] flex-col items-center justify-center gap-2 px-2 py-2 sm:min-h-[96px] sm:px-5 sm:py-4">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-7 w-10" />
          </CardContent>
        </Card>
      </div>
      <Card class="mt-6">
        <CardHeader><Skeleton class="h-5 w-32" /></CardHeader>
        <CardContent class="space-y-3 p-4">
          <Card v-for="item in 4" :key="item" class="shadow-none">
            <CardContent class="grid gap-4 p-4">
              <div class="flex items-center justify-between gap-3"><Skeleton class="h-4 w-28" /><Skeleton class="h-5 w-16 rounded-full" /></div>
              <div class="grid grid-cols-4 gap-2"><Skeleton v-for="field in 4" :key="field" class="h-8 w-full" /></div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>

    <template v-else>
      <div class="mt-6 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-6">
        <Card v-for="item in summaryCards" :key="item.label" :class="['gap-0 overflow-hidden border-0 py-0 text-white', item.tone]">
          <CardContent class="p-0">
            <div class="flex min-h-[84px] flex-col items-center justify-center px-2 py-2 text-center sm:min-h-[96px] sm:px-5 sm:py-4">
              <p class="text-xs font-medium leading-tight text-white/80 sm:text-sm">{{ item.label }}</p>
              <p class="mt-1 text-2xl font-bold leading-none sm:text-3xl">{{ item.value }}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs default-value="daily-records" class="mt-6">
        <TabsList class="w-full">
          <TabsTrigger value="daily-records">Daily records</TabsTrigger>
          <TabsTrigger value="upcoming-holidays">Upcoming holidays</TabsTrigger>
          <TabsTrigger value="team-roster">Team Roster</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-records" class="mt-3">
          <Card>
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
                  <div class="mt-4 grid grid-cols-4 gap-2 text-xs">
                    <div class="min-w-0"><p class="text-[10px] leading-tight text-slate-500">Clock in</p><p class="mt-1 truncate font-medium text-slate-700">{{ formatTime(day.clock_in) }}</p></div>
                    <div class="min-w-0"><p class="text-[10px] leading-tight text-slate-500">Clock out</p><p class="mt-1 truncate font-medium text-slate-700">{{ formatTime(day.clock_out) }}</p></div>
                    <div class="min-w-0"><p class="text-[10px] leading-tight text-slate-500">Late</p><p class="mt-1 truncate font-medium text-slate-700">{{ day.late_minutes ? `${day.late_minutes} min` : '—' }}</p></div>
                    <div class="min-w-0"><p class="text-[10px] leading-tight text-slate-500">Worked hours</p><p class="mt-1 truncate font-medium text-slate-700">{{ day.worked_hours || '—' }}</p></div>
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
        </TabsContent>

        <TabsContent value="upcoming-holidays" class="mt-3">
          <Card>
            <CardHeader><CardTitle>Upcoming holidays</CardTitle></CardHeader>
            <CardContent class="p-0">
              <div v-if="holidaysLoading" class="space-y-3 p-4" role="status" aria-live="polite" aria-label="Loading upcoming holidays">
                <div v-for="item in 3" :key="item" class="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-4">
                  <div class="grid flex-1 gap-2"><Skeleton class="h-4 w-40" /><Skeleton class="h-3 w-56 max-w-full" /></div>
                  <Skeleton class="h-6 w-16 rounded-full" />
                </div>
              </div>
              <div v-else-if="holidaysError" class="flex items-center justify-between gap-4 px-6 py-8 text-sm text-red-600">
                <span>{{ holidaysError }}</span>
                <Button variant="outline" size="sm" @click="loadUpcomingHolidays">Try again</Button>
              </div>
              <div v-else-if="upcomingHolidays.length === 0" class="px-6 py-8 text-center text-sm text-slate-500">
                No upcoming holidays this month.
              </div>
              <div v-else class="divide-y divide-slate-100">
                <div v-for="holiday in upcomingHolidays" :key="holiday.id" class="flex items-center justify-between gap-4 px-6 py-4">
                  <div class="min-w-0">
                    <p class="truncate font-medium text-slate-800">{{ holiday.name || 'Holiday' }}</p>
                    <p class="mt-1 text-sm text-slate-500">{{ formatHolidayDates(holiday) }}</p>
                  </div>
                  <span class="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {{ holiday.days }} {{ holiday.days === 1 ? 'day' : 'days' }}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-roster" class="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
              <p v-if="teamRoster.department" class="text-sm text-slate-500">
                {{ teamRoster.department.name }}
                <span v-if="teamRoster.range"> · {{ formatDate(teamRoster.range.start_date) }} - {{ formatDate(teamRoster.range.end_date) }}</span>
              </p>
            </CardHeader>
            <CardContent class="p-0">
              <div v-if="rosterLoading" class="space-y-3 p-4" role="status" aria-live="polite" aria-label="Loading team roster">
                <div v-for="item in 4" :key="item" class="grid w-full grid-cols-[38%_repeat(7,minmax(0,1fr))] gap-1 rounded-lg border border-slate-100 p-2 sm:flex sm:min-w-[720px] sm:gap-3 sm:p-4">
                  <Skeleton class="h-8 w-full sm:w-32" />
                  <Skeleton v-for="day in 7" :key="day" class="h-8 w-full sm:w-16" />
                </div>
              </div>
              <div v-else-if="rosterError" class="flex items-center justify-between gap-4 px-6 py-8 text-sm text-red-600">
                <span>{{ rosterError }}</span>
                <Button variant="outline" size="sm" @click="loadTeamRoster">Try again</Button>
              </div>
              <div v-else-if="!teamRoster.department" class="px-6 py-8 text-center text-sm text-slate-500">
                No department is assigned to your employee profile.
              </div>
              <div v-else-if="teamRoster.employees.length === 0" class="px-6 py-8 text-center text-sm text-slate-500">
                No active employees found in {{ teamRoster.department.name }}.
              </div>
              <div v-else class="overflow-hidden sm:overflow-x-auto">
                <table class="w-full min-w-0 table-fixed text-left text-sm sm:min-w-[920px]">
                  <thead class="border-y border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-700">
                    <tr>
                      <th class="sticky left-0 z-10 w-[38%] bg-slate-100 px-2 py-3 font-semibold text-slate-700 sm:w-48 sm:px-4">Employee</th>
                      <th v-for="day in teamRoster.days" :key="day.date" class="w-auto px-0.5 py-3 text-center font-semibold text-slate-700 sm:w-24 sm:px-2">
                        <span class="block text-[10px] font-bold text-slate-700 sm:text-xs" :aria-label="`Roster day ${day.label}`" :title="day.label">{{ day.label }}</span>
                        <span class="mt-1 hidden text-[10px] font-normal normal-case sm:block">{{ formatDate(day.date) }}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="employee in teamRoster.employees" :key="employee.id">
                      <td class="sticky left-0 z-10 w-[38%] bg-white px-2 py-3 sm:w-48 sm:px-4">
                        <p class="truncate font-medium text-slate-800">{{ employee.name || 'Employee' }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ employee.employee_id || 'No employee ID' }}</p>
                      </td>
                      <td v-for="day in teamRoster.days" :key="day.date" class="w-auto px-0.5 py-3 text-center sm:w-24 sm:px-2">
                        <span
                          :class="['inline-flex size-5 items-center justify-center rounded-full px-0 py-0 text-[10px] font-semibold sm:h-auto sm:w-auto sm:px-2 sm:py-1 sm:text-xs', statusClass(rosterStatus(employee, day.date))]"
                          :aria-label="`${statusLabel(rosterStatus(employee, day.date))} on ${day.label}`"
                          :title="statusLabel(rosterStatus(employee, day.date))"
                        >
                          <span class="sm:hidden">{{ statusShortLabel(rosterStatus(employee, day.date)) }}</span>
                          <span class="hidden sm:inline">{{ statusLabel(rosterStatus(employee, day.date)) }}</span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </template>
  </section>
</template>
