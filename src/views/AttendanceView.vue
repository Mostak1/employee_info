<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Compass,
  Info,
  LoaderCircle,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  RefreshCw,
  Send,
  ShieldCheck,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useGeolocation } from '../composables/useGeolocation'
import { runtimeRequest } from '../lib/api'

const { getCurrentLocation, loading: geoLoading } = useGeolocation()
const punchLoading = ref(true)
const punchSubmitting = ref(false)
const showPunchOutConfirm = ref(false)
const punchData = ref({
  allow_remote: false,
  today: '',
  has_clocked_in: false,
  has_clocked_out: false,
  attendance: null,
  shift: null,
  remote_location: {
    has_default_location: false,
    default_location: null,
    pending_request: null,
  },
})
const currentTime = ref(new Date())
let clockTimer = null

// Remote work location registration
const locationModalOpen = ref(false)
const locationAddressName = ref('')
const locationReason = ref('')
const locationCoords = ref(null)
const locationCapturing = ref(false)
const locationPermissionBlocked = ref(false)
const locationSubmitting = ref(false)

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

const formattedLiveTime = computed(() => {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentTime.value)
})

const formattedLiveDate = computed(() => {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(currentTime.value)
})

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

function formatDayOfMonth(value) {
  if (!value) return ''
  const parts = value.split('-')
  return parts.length >= 3 ? parts[2] : value
}

function statusClass(status) {
  return {
    present: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60',
    late: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/60',
    absent: 'bg-red-100 text-red-800 ring-1 ring-red-300/60',
    leave: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/60',
    unpaid_leave: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300/60',
    holiday: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300/60',
    weekend: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    exchange: 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300/60',
    off: 'bg-slate-50 text-slate-400 ring-1 ring-slate-200',
  }[status] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
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

async function loadPunchStatus() {
  punchLoading.value = true
  try {
    const { data } = await runtimeRequest('get', 'attendanceStatus')
    punchData.value = data
  } catch {
    punchData.value.allow_remote = false
  } finally {
    punchLoading.value = false
  }
}

async function captureCurrentLocation() {
  locationCapturing.value = true
  locationPermissionBlocked.value = false
  try {
    const loc = await getCurrentLocation()
    if (loc.success && loc.latitude && loc.longitude) {
      locationCoords.value = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy || null,
      }
      locationPermissionBlocked.value = false
    } else {
      if (loc.isPermissionDenied) {
        locationPermissionBlocked.value = true
        toast.error('Location Access Blocked', {
          description: 'Please enable location access in your browser address bar to continue.',
        })
      } else {
        toast.error('Location Error', {
          description: loc.error || 'Failed to detect GPS coordinates. Please click Re-detect.',
        })
      }
    }
  } catch (err) {
    toast.error('GPS Detection Failed', {
      description: err.message || 'Unable to access your device location.',
    })
  } finally {
    locationCapturing.value = false
  }
}

function openLocationModal() {
  locationAddressName.value = punchData.value.remote_location?.default_location?.address || ''
  locationReason.value = ''
  locationCoords.value = null
  locationPermissionBlocked.value = false
  locationModalOpen.value = true
  captureCurrentLocation()
}

async function submitLocationRequest() {
  if (!locationCoords.value?.latitude || !locationCoords.value?.longitude) {
    toast.error('GPS Coordinates Missing', {
      description: 'Please wait for GPS coordinates to be captured or click Re-detect.',
    })
    return
  }

  if (!locationAddressName.value.trim()) {
    toast.error('Address Name Required', {
      description: 'Please provide a location name or label (e.g. Home Office).',
    })
    return
  }

  locationSubmitting.value = true
  try {
    const { data } = await runtimeRequest('post', 'requestLocation', {
      data: {
        latitude: locationCoords.value.latitude,
        longitude: locationCoords.value.longitude,
        address_name: locationAddressName.value.trim(),
        reason: locationReason.value.trim() || null,
      },
    })

    toast.success('Location Request Submitted', {
      description: data.message || 'Your work location has been submitted for admin verification.',
    })
    locationModalOpen.value = false
    await loadPunchStatus()
  } catch (err) {
    toast.error('Submission Failed', {
      description: err.response?.data?.message || 'Unable to submit your remote location request.',
    })
  } finally {
    locationSubmitting.value = false
  }
}

async function handlePunch(action) {
  if (punchSubmitting.value) return

  // Check if user has or doesn't have default location
  if (punchData.value.allow_remote) {
    if (!punchData.value.remote_location?.has_default_location) {
      if (punchData.value.remote_location?.pending_request) {
        toast.warning('Location Verification Pending', {
          description: 'Your registered work location is awaiting Admin approval before you can clock in.',
        })
        return
      }
      // If default location is null -> open location request modal directly with GPS capture
      openLocationModal()
      return
    }
  }

  punchSubmitting.value = true

  try {
    const location = await getCurrentLocation()

    if (!location.success || !location.latitude || !location.longitude) {
      toast.error('GPS Location Required', {
        description: location.error || 'Please enable GPS / location permissions on your device to clock in or out.',
      })
      punchSubmitting.value = false
      return
    }

    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
    }

    if (action === 'in') {
      const { data } = await runtimeRequest('post', 'clockIn', { data: payload })
      toast.success('Clock In Successful', {
        description: `Clocked in at ${formatTime(data.attendance?.clock_in_time)}.`,
      })
    } else {
      const { data } = await runtimeRequest('post', 'clockOut', { data: payload })
      toast.success('Clock Out Successful', {
        description: `Clocked out at ${formatTime(data.attendance?.clock_out_time)}. Total worked: ${data.attendance?.worked_hours ?? 0} hrs.`,
      })
    }

    await Promise.all([loadPunchStatus(), loadAttendance()])
  } catch (err) {
    const errorData = err.response?.data
    const errorCode = errorData?.error_code

    if (errorCode === 'NO_DEFAULT_LOCATION') {
      toast.error('Location Setup Required', {
        description: errorData.message || 'Please register your default remote work location first.',
      })
      openLocationModal()
    } else if (errorCode === 'LOCATION_REQUEST_PENDING') {
      toast.warning('Location Verification Pending', {
        description: errorData.message || 'Your remote work location is pending admin approval.',
      })
    } else if (errorCode === 'LOCATION_OUT_OF_BOUNDS') {
      toast.error('Outside Approved Work Location', {
        description: errorData.message || `You are ${errorData.distance_meters}m away. Maximum allowed geofence is 150m.`,
      })
    } else {
      toast.error('Clock Action Failed', {
        description: errorData?.message || 'Unable to record your attendance. Please try again.',
      })
    }
  } finally {
    punchSubmitting.value = false
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
  clockTimer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
  loadPunchStatus()
  loadAttendance()
  loadCasualLeaveBalance()
  loadUpcomingHolidays()
  loadTeamRoster()
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
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
          as-child
          size="sm"
          class="gap-1.5 rounded-xl bg-teal-700 font-semibold text-white shadow-xs hover:bg-teal-800"
        >
          <RouterLink :to="{ name: 'requests' }">
            <Send class="size-3.5" />
            <span>Apply Leave</span>
          </RouterLink>
        </Button>
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

    <!-- Attendance Month Filter Dialog -->
    <Dialog v-model:open="filterOpen">
      <DialogContent class="sm:max-w-md rounded-2xl border-slate-200 bg-white p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-slate-900">Filter Attendance</DialogTitle>
          <DialogDescription class="text-xs text-slate-500">Select a month to view your attendance history and summary.</DialogDescription>
        </DialogHeader>
        <form class="mt-2 grid gap-4" @submit.prevent="applyFilter">
          <label class="grid gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <span>Select Month</span>
            <Select v-model="selectedPeriod">
              <SelectTrigger class="bg-white" aria-label="Select attendance month">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="previous_month">Previous month</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <DialogFooter class="mt-4 flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" class="flex-1 sm:flex-initial" :disabled="loading" @click="resetFilter">Reset</Button>
            <Button type="submit" class="flex-1 sm:flex-initial bg-teal-700 text-white hover:bg-teal-800" :disabled="loading">Apply Filter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Remote Work Location Registration / Update Dialog -->
    <Dialog v-model:open="locationModalOpen">
      <DialogContent class="sm:max-w-lg rounded-2xl border-slate-200 bg-white p-5 sm:p-6">
        <DialogHeader>
          <div class="flex items-center gap-2.5 text-teal-700">
            <div class="flex size-9 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-200">
              <MapPin class="size-5" />
            </div>
            <div>
              <DialogTitle class="text-lg font-bold text-slate-900">
                {{ punchData.remote_location?.has_default_location ? 'Update Remote Work Location' : 'Register Remote Work Location' }}
              </DialogTitle>
              <DialogDescription class="text-xs text-slate-500">
                Submit your current GPS location for verification. Geofence radius is 150 meters.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form class="mt-4 space-y-4" @submit.prevent="submitLocationRequest">
          <!-- Permission Denied Helper Banner -->
          <div
            v-if="locationPermissionBlocked"
            class="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 space-y-1.5"
          >
            <p class="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertCircle class="size-4 shrink-0 text-rose-600" />
              Location Access Blocked in Browser
            </p>
            <p class="text-[11px] text-rose-700 leading-relaxed">
              Your browser blocked location access. To allow access:
            </p>
            <ol class="list-decimal list-inside text-[11px] text-rose-800 space-y-0.5">
              <li>Click the <strong>icon / tune button</strong> next to the URL in your browser's address bar.</li>
              <li>Set <strong>Location</strong> to <strong>Allow</strong>.</li>
              <li>Click the <strong>"Re-detect"</strong> button below.</li>
            </ol>
          </div>

          <!-- GPS Capture Box -->
          <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Navigation class="size-4 text-teal-600" />
                <span>GPS Coordinates</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-7 gap-1 text-xs text-teal-700 hover:bg-teal-100/60"
                :disabled="locationCapturing || geoLoading"
                @click="captureCurrentLocation"
              >
                <LoaderCircle v-if="locationCapturing || geoLoading" class="size-3.5 animate-spin" />
                <RefreshCw v-else class="size-3.5" />
                <span>{{ locationCapturing || geoLoading ? 'Locating…' : 'Re-detect' }}</span>
              </Button>
            </div>

            <div v-if="locationCoords" class="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <div class="rounded-lg bg-white p-2 border border-slate-200">
                <p class="text-[10px] text-slate-400 font-mono">LATITUDE</p>
                <p class="font-mono font-bold text-slate-800">{{ locationCoords.latitude?.toFixed(6) }}</p>
              </div>
              <div class="rounded-lg bg-white p-2 border border-slate-200">
                <p class="text-[10px] text-slate-400 font-mono">LONGITUDE</p>
                <p class="font-mono font-bold text-slate-800">{{ locationCoords.longitude?.toFixed(6) }}</p>
              </div>
              <p class="col-span-2 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 class="size-3.5" /> High accuracy GPS coordinates locked
              </p>
            </div>
            <div v-else class="mt-2.5 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 flex items-center gap-2 border border-amber-200">
              <LoaderCircle v-if="locationCapturing || geoLoading" class="size-4 animate-spin shrink-0" />
              <AlertCircle v-else class="size-4 shrink-0" />
              <span>{{ locationCapturing || geoLoading ? 'Detecting your device GPS location…' : 'Click "Re-detect" to acquire your current location coordinates.' }}</span>
            </div>
          </div>

          <!-- Address Label -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700">
              Location Label / Address <span class="text-rose-500">*</span>
            </label>
            <Input
              v-model="locationAddressName"
              placeholder="e.g. Home Office - Banani, Dhaka"
              class="bg-white"
              required
            />
            <p class="text-[11px] text-slate-500">Provide a clear description so HR/Admin can recognize this location.</p>
          </div>

          <!-- Reason / Notes -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700">
              Reason / Note <span class="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Textarea
              v-model="locationReason"
              placeholder="e.g. Primary home office for remote work schedule"
              rows="2"
              class="bg-white"
            />
          </div>

          <!-- Notice -->
          <div class="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-[11px] text-sky-800 leading-relaxed">
            <p class="font-semibold text-sky-900 flex items-center gap-1">
              <ShieldCheck class="size-3.5 text-sky-600" /> Single-approval verification
            </p>
            <p class="mt-0.5">
              Once submitted, HR or authorized admin will review and approve your location. You will be able to clock in and out when within <strong>150 meters</strong> of this approved position.
            </p>
          </div>

          <DialogFooter class="mt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              :disabled="locationSubmitting"
              @click="locationModalOpen = false"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              class="bg-teal-700 text-white hover:bg-teal-800"
              :disabled="locationSubmitting || !locationCoords || !locationAddressName.trim()"
            >
              <LoaderCircle v-if="locationSubmitting" class="mr-1.5 size-4 animate-spin" />
              <span>{{ locationSubmitting ? 'Submitting…' : 'Submit Request' }}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Clock Out Confirmation Alert Dialog -->
    <AlertDialog v-model:open="showPunchOutConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Clock Out</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clock out for today? This will record your departure time and GPS location to conclude your workday.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="punchSubmitting">Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-rose-600 text-white hover:bg-rose-700"
            :disabled="punchSubmitting || geoLoading"
            @click="handlePunch('out')"
          >
            <LoaderCircle v-if="punchSubmitting || geoLoading" class="mr-1.5 size-4 animate-spin" />
            <span>{{ punchSubmitting ? 'Clocking Out…' : 'Yes, Clock Out' }}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Remote Attendance Quick Clock Card -->
    <Card v-if="punchData.allow_remote" class="mt-6 overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 shadow-sm">
      <CardContent class="p-4 sm:p-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <span class="relative flex size-2.5">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span class="relative inline-flex size-2.5 rounded-full bg-teal-600"></span>
              </span>
              <span>Remote Attendance</span>
              <span v-if="punchData.shift" class="text-slate-400">·</span>
              <span v-if="punchData.shift" class="font-normal text-slate-600 lowercase first-letter:uppercase">{{ punchData.shift.name }}</span>
            </div>

            <div class="flex items-baseline gap-3 pt-1">
              <p class="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{{ formattedLiveTime }}</p>
              <p class="text-xs sm:text-sm font-medium text-slate-500">{{ formattedLiveDate }}</p>
            </div>

            <p v-if="punchData.shift?.start_time" class="text-xs text-slate-500">
              Shift hours: {{ String(punchData.shift.start_time).slice(0, 5) }} – {{ punchData.shift.end_time ? String(punchData.shift.end_time).slice(0, 5) : 'Flexible' }}
            </p>
          </div>

          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <!-- State 1: Not Clocked In -->
            <template v-if="!punchData.has_clocked_in">
              <Button
                size="lg"
                class="h-12 w-full gap-2 rounded-xl bg-teal-700 px-6 text-base font-bold text-white shadow-md transition-all hover:bg-teal-800 active:scale-95 sm:w-auto"
                :disabled="punchSubmitting || geoLoading"
                @click="handlePunch('in')"
              >
                <LoaderCircle v-if="punchSubmitting || geoLoading" class="size-5 animate-spin" />
                <LogIn v-else class="size-5" />
                <span>{{ punchSubmitting ? 'Clocking In…' : 'Clock In' }}</span>
              </Button>
            </template>

            <!-- State 2: Clocked In (Active workday) -->
            <template v-else-if="!punchData.has_clocked_out">
              <div class="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 class="size-4 shrink-0 text-emerald-600" />
                <span>In at <strong>{{ formatTime(punchData.attendance?.clock_in_time) }}</strong></span>
                <span v-if="punchData.attendance?.late_minutes > 0" class="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">
                  Late {{ punchData.attendance.late_minutes }}m
                </span>
              </div>

              <Button
                size="lg"
                class="h-12 w-full gap-2 rounded-xl bg-rose-600 px-6 text-base font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-95 sm:w-auto"
                :disabled="punchSubmitting || geoLoading"
                @click="showPunchOutConfirm = true"
              >
                <LoaderCircle v-if="punchSubmitting || geoLoading" class="size-5 animate-spin" />
                <LogOut v-else class="size-5" />
                <span>{{ punchSubmitting ? 'Clocking Out…' : 'Clock Out' }}</span>
              </Button>
            </template>

            <!-- State 3: Clocked Out (Completed Day) -->
            <template v-else>
              <div class="flex flex-col gap-1 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-2.5 text-xs text-teal-900 sm:items-end">
                <div class="flex items-center gap-1.5 font-semibold text-teal-800">
                  <CheckCircle2 class="size-4 text-teal-600" />
                  <span>Workday Completed</span>
                </div>
                <div class="text-[11px] text-slate-600">
                  <span>In: {{ formatTime(punchData.attendance?.clock_in_time) }}</span>
                  <span class="mx-1.5">·</span>
                  <span>Out: {{ formatTime(punchData.attendance?.clock_out_time) }}</span>
                  <span class="mx-1.5">·</span>
                  <strong class="font-bold text-teal-700">{{ punchData.attendance?.worked_hours }} hrs</strong>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Pending Request Banner -->
        <div
          v-if="punchData.remote_location?.pending_request"
          class="mt-4 rounded-xl border border-sky-200 bg-sky-50/90 p-3 sm:p-3.5 text-xs"
        >
          <div class="flex items-center gap-2.5 text-sky-900">
            <LoaderCircle class="size-4 text-sky-600 shrink-0 animate-spin" />
            <p class="text-xs">
              Location verification pending: <span class="font-semibold">"{{ punchData.remote_location.pending_request.address_name }}"</span>
              <span v-if="punchData.remote_location.pending_request.created_at"> (submitted {{ formatDate(punchData.remote_location.pending_request.created_at.slice(0, 10)) }})</span>.
              Awaiting Admin approval.
            </p>
          </div>
        </div>

        <!-- Approved Default Location -->
        <div
          v-else-if="punchData.remote_location?.has_default_location"
          class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-teal-100 pt-2.5 text-xs text-teal-900"
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <ShieldCheck class="size-4 text-teal-600 shrink-0" />
            <span class="truncate text-slate-600 text-[11px] sm:text-xs">
              Approved Location: <strong class="font-semibold text-slate-800">{{ punchData.remote_location.default_location.address }}</strong>
              <span class="ml-1 text-slate-500 font-mono text-[10px] sm:text-[11px]">({{ punchData.remote_location.default_location.radius ?? 150 }}m geofence)</span>
            </span>
          </div>
          <button
            type="button"
            class="text-[11px] font-semibold text-teal-700 hover:underline hover:text-teal-900 shrink-0"
            @click="openLocationModal"
          >
            Request Change
          </button>
        </div>

        <!-- Location recorded during punch -->
        <div v-if="punchData.has_clocked_in && punchData.attendance?.clock_in_location" class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <MapPin class="size-3.5 text-teal-600 shrink-0" />
          <span>
            Today's Punch GPS: <span class="font-medium text-slate-700">{{ punchData.attendance.clock_in_location }}</span>
          </span>
        </div>
      </CardContent>
    </Card>

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
            <CardHeader class="pb-3">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Team Roster</CardTitle>
                  <p v-if="teamRoster.department" class="mt-0.5 text-sm text-slate-500">
                    {{ teamRoster.department.name }}
                    <span v-if="teamRoster.range"> · {{ formatDate(teamRoster.range.start_date) }} – {{ formatDate(teamRoster.range.end_date) }}</span>
                  </p>
                </div>
                <!-- Status Legend -->
                <div class="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-slate-600">
                  <span class="inline-flex items-center gap-1"><span class="flex size-4 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-[9px] ring-1 ring-emerald-300/60">P</span> Present</span>
                  <span class="inline-flex items-center gap-1"><span class="flex size-4 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-[9px] ring-1 ring-slate-200">W</span> Weekend</span>
                  <span class="inline-flex items-center gap-1"><span class="flex size-4 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-800 text-[9px] ring-1 ring-violet-300/60">L</span> Leave</span>
                  <span class="inline-flex items-center gap-1"><span class="flex size-4 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-800 text-[9px] ring-1 ring-sky-300/60">H</span> Holiday</span>
                </div>
              </div>
            </CardHeader>
            <CardContent class="p-0">
              <div v-if="rosterLoading" class="space-y-3 p-4" role="status" aria-live="polite" aria-label="Loading team roster">
                <div v-for="item in 4" :key="item" class="flex items-center gap-2 rounded-lg border border-slate-100 p-3">
                  <Skeleton class="h-9 w-28 sm:w-40 shrink-0" />
                  <div class="grid flex-1 grid-cols-7 gap-1.5">
                    <Skeleton v-for="day in 7" :key="day" class="h-8 rounded-md" />
                  </div>
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
              <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[560px] border-collapse text-left text-sm sm:min-w-[700px]">
                  <thead>
                    <tr class="border-y border-slate-200 bg-slate-50">
                      <th class="sticky left-0 z-20 w-36 min-w-[130px] bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 border-r border-slate-200 sm:w-48 sm:px-4">
                        Employee
                      </th>
                      <th
                        v-for="day in teamRoster.days"
                        :key="day.date"
                        class="min-w-[48px] px-1 py-2.5 text-center sm:px-2 sm:py-3"
                      >
                        <span class="block text-xs font-bold text-slate-700">{{ day.label }}</span>
                        <span class="mt-0.5 block text-[10px] font-medium text-slate-500">{{ formatDayOfMonth(day.date) }}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="employee in teamRoster.employees" :key="employee.id" class="transition-colors hover:bg-slate-50/60">
                      <td class="sticky left-0 z-10 w-36 min-w-[130px] bg-white px-3 py-3 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] sm:w-48 sm:px-4">
                        <p class="truncate font-semibold text-slate-900 leading-snug" :title="employee.name">{{ employee.name || 'Employee' }}</p>
                        <p class="mt-0.5 text-xs text-slate-500 font-mono">{{ employee.employee_id || '—' }}</p>
                      </td>
                      <td
                        v-for="day in teamRoster.days"
                        :key="day.date"
                        class="px-1 py-3 text-center align-middle sm:px-2"
                      >
                        <div class="flex items-center justify-center">
                          <span
                            :class="[
                              'flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-transform hover:scale-110 sm:h-7 sm:w-auto sm:min-w-[28px] sm:px-2.5 sm:rounded-md sm:text-xs',
                              statusClass(rosterStatus(employee, day.date))
                            ]"
                            :title="`${employee.name || 'Employee'}: ${statusLabel(rosterStatus(employee, day.date))} on ${day.label} (${formatDate(day.date)})`"
                          >
                            <span class="sm:hidden">{{ statusShortLabel(rosterStatus(employee, day.date)) }}</span>
                            <span class="hidden sm:inline">{{ statusShortLabel(rosterStatus(employee, day.date)) }}</span>
                          </span>
                        </div>
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
