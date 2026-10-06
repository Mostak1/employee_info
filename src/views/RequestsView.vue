<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  FileText,
  Filter,
  Info,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  XCircle,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { runtimeRequest } from '../lib/api'

// States
const loading = ref(true)
const metaLoading = ref(true)
const submitting = ref(false)
const cancelingId = ref(null)
const error = ref('')

const requests = ref([])
const leaveTypes = ref([])
const overtimeEligible = ref(false)
const currentYear = ref(new Date().getFullYear())
const applicant = ref({
  name: '',
  rf_id: '',
  designation: '',
  department: '',
  contact_number: '',
  manager_name: '',
})

// Pagination & Filter states
const activeTab = ref('all') // all, pending, approved, rejected, leave, overtime
const currentPage = ref(1)
const itemsPerPage = ref(5)
const applyDialogOpen = ref(false)
const applyMode = ref('leave') // leave, overtime
const mobilePreviewTab = ref('form') // form, preview

// Leave Form State
const leaveForm = ref({
  essentials_leave_type_id: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  reason: '',
  application_description: '',
})

// Overtime Form State
const otForm = ref({
  request_date: new Date().toISOString().slice(0, 10),
  hours: 1,
  start_time: '',
  end_time: '',
  reason: '',
  notes: '',
})

// Cancel confirmation state
const cancelTarget = ref(null)
const cancelDialogOpen = ref(false)

// Computed
const selectedLeaveTypeObj = computed(() => {
  if (!leaveForm.value.essentials_leave_type_id) return null
  return leaveTypes.value.find((t) => String(t.id) === String(leaveForm.value.essentials_leave_type_id)) || null
})

const calculatedLeaveDays = computed(() => {
  if (!leaveForm.value.start_date || !leaveForm.value.end_date) return 0
  const start = new Date(leaveForm.value.start_date)
  const end = new Date(leaveForm.value.end_date)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  if (end < start) return 0
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
})

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return requests.value
  if (activeTab.value === 'pending') return requests.value.filter((r) => r.status === 'pending')
  if (activeTab.value === 'approved') return requests.value.filter((r) => r.status === 'approved')
  if (activeTab.value === 'rejected') return requests.value.filter((r) => r.status === 'rejected')
  if (activeTab.value === 'leave') return requests.value.filter((r) => r.category === 'leave')
  if (activeTab.value === 'overtime') return requests.value.filter((r) => r.category === 'overtime')
  return requests.value
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredRequests.value.length / itemsPerPage.value))
})

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredRequests.value.slice(start, start + itemsPerPage.value)
})

function handleTabChange(tabId) {
  activeTab.value = tabId
  currentPage.value = 1
}

function handlePageChange(newPage) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage
    // Smooth scroll to top of list
    window.scrollTo({ top: 180, behavior: 'smooth' })
  }
}

const statusCounts = computed(() => {
  return {
    all: requests.value.length,
    pending: requests.value.filter((r) => r.status === 'pending').length,
    approved: requests.value.filter((r) => r.status === 'approved').length,
    rejected: requests.value.filter((r) => r.status === 'rejected').length,
  }
})

const filterTabs = computed(() => {
  const tabs = [
    { id: 'all', label: 'All', count: statusCounts.value.all },
    { id: 'pending', label: 'Pending', count: statusCounts.value.pending },
    { id: 'approved', label: 'Approved', count: statusCounts.value.approved },
    { id: 'rejected', label: 'Rejected', count: statusCounts.value.rejected },
  ]
  if (overtimeEligible.value || requests.value.some((r) => r.category === 'overtime')) {
    tabs.push({ id: 'leave', label: 'Leaves' })
    tabs.push({ id: 'overtime', label: 'Overtime' })
  }
  return tabs
})

// Date helper
function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  )
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date)
}

function statusBadgeClass(status) {
  return {
    pending: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/60',
    approved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60',
    rejected: 'bg-rose-100 text-rose-800 ring-1 ring-rose-300/60',
    cancelled: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }[status] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

const ALLOWED_LEAVE_TYPES = ['casual leave', 'holiday exchange', 'unpaid leave', 'weekend exchange']

function isAllowedLeaveType(typeName) {
  const norm = (typeName || '').toLowerCase().trim()
  return ALLOWED_LEAVE_TYPES.some((allowed) => norm.includes(allowed) || allowed.includes(norm))
}

// Data loaders
async function loadMeta() {
  metaLoading.value = true
  try {
    const { data } = await runtimeRequest('get', 'requestsMeta')
    const rawLeaveTypes = data.leave_types || []
    leaveTypes.value = rawLeaveTypes.filter((t) => isAllowedLeaveType(t.leave_type))
    overtimeEligible.value = Boolean(data.overtime_eligible)
    currentYear.value = data.year || new Date().getFullYear()
    applicant.value = data.applicant || {
      name: '',
      rf_id: '',
      designation: '',
      department: '',
      contact_number: '',
      manager_name: '',
    }

    if (leaveTypes.value.length > 0 && !leaveForm.value.essentials_leave_type_id) {
      leaveForm.value.essentials_leave_type_id = String(leaveTypes.value[0].id)
    }
  } catch (err) {
    console.error('Failed to load request metadata', err)
  } finally {
    metaLoading.value = false
  }
}

async function loadRequests() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await runtimeRequest('get', 'requests')
    requests.value = data.data || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to load applications list.'
  } finally {
    loading.value = false
  }
}

// Submit Leave
async function handleApplyLeave() {
  if (submitting.value) return

  if (!leaveForm.value.essentials_leave_type_id) {
    toast.error('Validation Error', { description: 'Please select a leave type.' })
    return
  }

  if (calculatedLeaveDays.value <= 0) {
    toast.error('Invalid Date Range', { description: 'End date cannot be earlier than start date.' })
    return
  }

  if (selectedLeaveTypeObj.value && calculatedLeaveDays.value > selectedLeaveTypeObj.value.remaining_days) {
    toast.error('Quota Exceeded', {
      description: `You only have ${selectedLeaveTypeObj.value.remaining_days} day(s) remaining for ${selectedLeaveTypeObj.value.leave_type}.`,
    })
    return
  }

  if (!leaveForm.value.reason || !leaveForm.value.reason.trim()) {
    toast.error('Validation Error', { description: 'Please provide a reason / subject for your leave request.' })
    return
  }

  submitting.value = true
  try {
    await runtimeRequest('post', 'applyLeave', {
      data: {
        essentials_leave_type_id: Number(leaveForm.value.essentials_leave_type_id),
        start_date: leaveForm.value.start_date,
        end_date: leaveForm.value.end_date,
        reason: leaveForm.value.reason.trim(),
        application_description: leaveForm.value.application_description?.trim() || undefined,
      },
    })

    toast.success('Application Submitted', {
      description: `Your ${selectedLeaveTypeObj.value?.leave_type || 'leave'} application for ${calculatedLeaveDays.value} day(s) was sent for approval.`,
    })

    applyDialogOpen.value = false
    // Reset
    leaveForm.value.reason = ''
    leaveForm.value.application_description = ''

    await Promise.all([loadMeta(), loadRequests()])
  } catch (err) {
    toast.error('Submission Failed', {
      description: err.response?.data?.message || 'Failed to submit leave request. Please check inputs and try again.',
    })
  } finally {
    submitting.value = false
  }
}

// Submit Overtime
async function handleApplyOvertime() {
  if (submitting.value) return

  if (!otForm.value.reason.trim()) {
    toast.error('Validation Error', { description: 'Please provide a reason / task for overtime.' })
    return
  }

  if (Number(otForm.value.hours) <= 0) {
    toast.error('Invalid Hours', { description: 'Overtime hours must be greater than 0.' })
    return
  }

  submitting.value = true
  try {
    await runtimeRequest('post', 'applyOvertime', {
      data: {
        request_date: otForm.value.request_date,
        hours: Number(otForm.value.hours),
        start_time: otForm.value.start_time || undefined,
        end_time: otForm.value.end_time || undefined,
        reason: otForm.value.reason,
        notes: otForm.value.notes || undefined,
      },
    })

    toast.success('Overtime Request Submitted', {
      description: `Your request for ${otForm.value.hours} hrs of overtime has been submitted.`,
    })

    applyDialogOpen.value = false
    otForm.value.reason = ''
    otForm.value.notes = ''

    await loadRequests()
  } catch (err) {
    toast.error('Submission Failed', {
      description: err.response?.data?.message || 'Failed to submit overtime request.',
    })
  } finally {
    submitting.value = false
  }
}

// Cancel
function confirmCancel(request) {
  cancelTarget.value = request
  cancelDialogOpen.value = true
}

async function handleCancelRequest() {
  if (!cancelTarget.value || cancelingId.value) return
  const target = cancelTarget.value
  cancelingId.value = target.id

  try {
    if (target.category === 'leave') {
      await runtimeRequest('delete', 'cancelLeave', { params: { id: target.id } })
    } else {
      await runtimeRequest('delete', 'cancelOvertime', { params: { id: target.id } })
    }

    toast.success('Application Cancelled', {
      description: `Your ${target.type_name} request has been cancelled.`,
    })

    cancelDialogOpen.value = false
    cancelTarget.value = null
    await Promise.all([loadMeta(), loadRequests()])
  } catch (err) {
    toast.error('Cancellation Failed', {
      description: err.response?.data?.message || 'Unable to cancel request.',
    })
  } finally {
    cancelingId.value = null
  }
}

onMounted(() => {
  loadMeta()
  loadRequests()
})
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-teal-700">HRM Requests</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900">Applications</h1>
        <p class="mt-1 text-sm text-slate-500">Apply for leaves or overtime and track your approval status.</p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="default"
          class="gap-2 rounded-xl bg-teal-700 px-5 font-semibold text-white shadow-sm transition-all hover:bg-teal-800 active:scale-95"
          @click="applyDialogOpen = true"
        >
          <Plus class="size-4" />
          <span>New Request</span>
        </Button>
      </div>
    </div>

    <!-- Leave Quota Summary Cards -->
    <div v-if="metaLoading" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Skeleton v-for="n in 4" :key="n" class="h-24 rounded-2xl" />
    </div>
    <div v-else-if="leaveTypes.length > 0" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card
        v-for="type in leaveTypes"
        :key="type.id"
        class="overflow-hidden border-teal-100 bg-white shadow-xs transition hover:shadow-md"
      >
        <CardContent class="p-3.5 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 uppercase">
              {{ type.prefix || 'LEAVE' }}
            </span>
            <span class="text-[11px] font-medium text-slate-400">{{ currentYear }}</span>
          </div>
          <p class="mt-2 truncate text-xs font-semibold text-slate-600">{{ type.leave_type }}</p>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-teal-800">{{ type.remaining_days }}</span>
            <span class="text-xs font-medium text-slate-400">/ {{ type.max_days }} days left</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filter Tabs & Counts -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <Button
          v-for="tab in filterTabs"
          :key="tab.id"
          size="sm"
          :variant="activeTab === tab.id ? 'default' : 'ghost'"
          class="h-8 gap-1.5 rounded-full px-3.5 text-xs font-medium"
          :class="activeTab === tab.id ? 'bg-teal-700 text-white hover:bg-teal-800' : 'text-slate-600 hover:bg-slate-100'"
          @click="handleTabChange(tab.id)"
        >
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.count !== undefined"
            class="rounded-full px-1.5 py-0.2 text-[10px] font-bold"
            :class="activeTab === tab.id ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'"
          >
            {{ tab.count }}
          </span>
        </Button>
      </div>

      <Button variant="ghost" size="sm" class="gap-1.5 text-xs text-slate-500" @click="loadRequests">
        <Clock3 class="size-3.5" />
        <span>Refresh</span>
      </Button>
    </div>

    <!-- Error State -->
    <Card v-if="error" class="border-red-200 bg-red-50 text-red-800">
      <CardContent class="flex items-center justify-between p-4 text-sm">
        <div class="flex items-center gap-2">
          <AlertCircle class="size-4 shrink-0 text-red-600" />
          <span>{{ error }}</span>
        </div>
        <Button size="sm" variant="outline" @click="loadRequests">Try again</Button>
      </CardContent>
    </Card>

    <!-- Requests List -->
    <div v-if="loading" class="space-y-4">
      <Skeleton v-for="n in 3" :key="n" class="h-36 rounded-2xl" />
    </div>

    <div v-else-if="filteredRequests.length === 0" class="rounded-3xl border border-dashed border-slate-200 bg-white py-12 text-center">
      <div class="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
        <FileText class="size-6" />
      </div>
      <h3 class="mt-3 text-base font-semibold text-slate-800">No applications found</h3>
      <p class="mt-1 text-xs text-slate-500">
        {{ activeTab === 'all' ? 'You have not submitted any applications yet.' : `No applications in '${activeTab}' filter.` }}
      </p>
      <Button
        size="sm"
        class="mt-4 gap-1.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800"
        @click="applyDialogOpen = true"
      >
        <Plus class="size-4" />
        <span>Apply Now</span>
      </Button>
    </div>

    <div v-else class="space-y-4">
      <Card
        v-for="req in paginatedRequests"
        :key="`${req.category}-${req.id}`"
        class="overflow-hidden border-slate-200 bg-white shadow-xs transition hover:border-teal-200 hover:shadow-sm"
      >
        <CardContent class="p-4 sm:p-5">
          <div class="flex flex-col gap-4">
            <!-- Header Row -->
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                    :class="req.category === 'leave' ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'"
                  >
                    {{ req.type_name }}
                  </span>
                  <span v-if="req.ref_no" class="font-mono text-xs text-slate-400">#{{ req.ref_no }}</span>
                  <span
                    v-if="req.is_future"
                    class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200"
                  >
                    Upcoming
                  </span>
                  <span
                    v-else-if="req.is_today"
                    class="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200"
                  >
                    Active Today
                  </span>
                </div>

                <!-- Date Range & Duration -->
                <div class="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="size-4 text-slate-400" />
                    <span v-if="req.start_date === req.end_date">{{ formatDate(req.start_date) }}</span>
                    <span v-else>{{ formatDate(req.start_date) }} – {{ formatDate(req.end_date) }}</span>
                  </div>
                  <span class="text-slate-300">·</span>
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {{ req.category === 'leave' ? `${req.duration_days} Day(s)` : `${req.duration_hours} Hour(s)` }}
                  </span>
                </div>
              </div>

              <!-- Status Badge & Cancel Action -->
              <div class="flex items-center gap-2">
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold capitalize"
                  :class="statusBadgeClass(req.status)"
                >
                  {{ req.status }}
                </span>

                <Button
                  v-if="req.can_cancel"
                  size="sm"
                  variant="ghost"
                  class="h-8 gap-1 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  :disabled="cancelingId === req.id"
                  @click="confirmCancel(req)"
                >
                  <Trash2 class="size-3.5" />
                  <span class="hidden sm:inline">Cancel</span>
                </Button>
              </div>
            </div>

            <!-- Reason / Description -->
            <div v-if="req.reason || req.application_description" class="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p v-if="req.reason" class="font-semibold text-slate-800">Reason: {{ req.reason }}</p>
              <p v-if="req.application_description" class="mt-1 text-slate-600">{{ req.application_description }}</p>
            </div>

            <!-- Multi-Tier Approval Stepper -->
            <div class="border-t border-slate-100 pt-3">
              <p class="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Approval Workflow</p>
              
              <div class="grid grid-cols-3 gap-2">
                <!-- Step 1: HOD / In-charge (Blue theme) -->
                <div
                  class="relative flex flex-col items-center gap-1 rounded-xl p-2 text-center transition"
                  :class="
                    req.approvals.hod.approved
                      ? 'bg-blue-50/90 text-blue-950 border border-blue-200 shadow-2xs'
                      : req.status === 'rejected'
                        ? 'bg-slate-50 text-slate-400 border border-slate-100'
                        : 'bg-amber-50/60 text-amber-900 border border-amber-200/60'
                  "
                >
                  <div class="flex items-center gap-1">
                    <CheckCircle2 v-if="req.approvals.hod.approved" class="size-3.5 text-blue-600" />
                    <Clock v-else class="size-3.5 text-amber-600" />
                    <span class="text-xs font-bold" :class="req.approvals.hod.approved ? 'text-blue-900' : ''">
                      {{ req.approvals.hod.title }}
                    </span>
                  </div>
                  <span
                    class="text-[10px] font-semibold"
                    :class="req.approvals.hod.approved ? 'text-blue-700' : 'text-amber-700'"
                  >
                    {{ req.approvals.hod.approved ? 'Approved' : (req.status === 'rejected' ? 'Skipped' : 'In Review') }}
                  </span>
                </div>

                <!-- Step 2: Human Resources (Indigo/Purple theme) -->
                <div
                  class="relative flex flex-col items-center gap-1 rounded-xl p-2 text-center transition"
                  :class="
                    req.approvals.hr.approved
                      ? 'bg-indigo-50/90 text-indigo-950 border border-indigo-200 shadow-2xs'
                      : !req.approvals.hod.approved
                        ? 'bg-slate-50 text-slate-400 border border-slate-100'
                        : 'bg-amber-50/60 text-amber-900 border border-amber-200/60'
                  "
                >
                  <div class="flex items-center gap-1">
                    <CheckCircle2 v-if="req.approvals.hr.approved" class="size-3.5 text-indigo-600" />
                    <Clock v-else class="size-3.5 text-slate-400" />
                    <span class="text-xs font-bold" :class="req.approvals.hr.approved ? 'text-indigo-900' : ''">
                      {{ req.approvals.hr.title }}
                    </span>
                  </div>
                  <span
                    class="text-[10px] font-semibold"
                    :class="req.approvals.hr.approved ? 'text-indigo-700' : 'text-slate-500'"
                  >
                    {{ req.approvals.hr.approved ? 'Approved' : (req.approvals.hod.approved && req.status === 'pending' ? 'In Review' : 'Pending') }}
                  </span>
                </div>

                <!-- Step 3: Management (Green theme) -->
                <div
                  class="relative flex flex-col items-center gap-1 rounded-xl p-2 text-center transition"
                  :class="
                    req.approvals.manager.approved
                      ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-200 shadow-2xs'
                      : req.status === 'rejected'
                        ? 'bg-rose-50 text-rose-900 border border-rose-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                  "
                >
                  <div class="flex items-center gap-1">
                    <CheckCircle2 v-if="req.approvals.manager.approved" class="size-3.5 text-emerald-600" />
                    <XCircle v-else-if="req.status === 'rejected'" class="size-3.5 text-rose-600" />
                    <Clock v-else class="size-3.5 text-slate-400" />
                    <span class="text-xs font-bold" :class="req.approvals.manager.approved ? 'text-emerald-900' : ''">
                      {{ req.approvals.manager.title }}
                    </span>
                  </div>
                  <span
                    class="text-[10px] font-semibold"
                    :class="req.approvals.manager.approved ? 'text-emerald-700' : req.status === 'rejected' ? 'text-rose-700' : 'text-slate-500'"
                  >
                    {{ req.approvals.manager.approved ? 'Final Approved' : req.status === 'rejected' ? 'Rejected' : 'Pending' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Footer: Submission date -->
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>Applied on {{ formatDateTime(req.created_at) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Pagination Controls -->
      <div
        v-if="filteredRequests.length > itemsPerPage"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 text-sm text-slate-500"
      >
        <span class="text-xs sm:text-sm">
          Showing <strong class="font-semibold text-slate-700">{{ (currentPage - 1) * itemsPerPage + 1 }}</strong>–<strong class="font-semibold text-slate-700">{{ Math.min(currentPage * itemsPerPage, filteredRequests.length) }}</strong> of <strong class="font-semibold text-slate-700">{{ filteredRequests.length }}</strong>
        </span>

        <Pagination
          :page="currentPage"
          :items-per-page="itemsPerPage"
          :total="filteredRequests.length"
          class="mx-0 w-auto"
          @update:page="handlePageChange"
        >
          <PaginationContent class="gap-1.5">
            <PaginationPrevious size="sm" class="h-8 rounded-lg text-xs" />
            <span class="whitespace-nowrap px-2 text-xs font-semibold text-slate-700" aria-live="polite">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <PaginationNext size="sm" class="h-8 rounded-lg text-xs" />
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- New Application Dialog -->
    <Dialog v-model:open="applyDialogOpen">
      <DialogContent class="sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 bg-white p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle class="text-xl font-bold text-slate-900">New Application</DialogTitle>
          <DialogDescription class="text-xs text-slate-500">
            Submit an application request for approval by your department in-charge and HR.
          </DialogDescription>
        </DialogHeader>

        <!-- Mode Toggle Tabs (only shown if user is eligible for overtime) -->
        <Tabs v-model="applyMode" class="mt-4">
          <TabsList v-if="overtimeEligible" class="grid w-full grid-cols-2">
            <TabsTrigger value="leave">Leave Request</TabsTrigger>
            <TabsTrigger value="overtime">Overtime Request</TabsTrigger>
          </TabsList>

          <!-- Leave Application Form & Live Preview -->
          <TabsContent value="leave" class="mt-4">
            <form @submit.prevent="handleApplyLeave" class="space-y-6">
              <div class="grid gap-6 lg:grid-cols-12">
                <!-- Left Column: Form Fields -->
                <div class="space-y-4 lg:col-span-6">
                  <!-- Leave Type Select -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Leave Type <span class="text-red-500">*</span>
                    </label>
                    <Select v-model="leaveForm.essentials_leave_type_id">
                      <SelectTrigger class="w-full bg-white">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="type in leaveTypes"
                          :key="type.id"
                          :value="String(type.id)"
                        >
                          {{ type.leave_type }} ({{ type.remaining_days }} days left)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <p v-if="selectedLeaveTypeObj" class="text-xs text-slate-500">
                      Available quota: <strong class="text-teal-700">{{ selectedLeaveTypeObj.remaining_days }} day(s)</strong>
                    </p>
                  </div>

                  <!-- Dates -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Start Date <span class="text-red-500">*</span>
                      </label>
                      <Input v-model="leaveForm.start_date" type="date" required />
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-slate-600">
                        End Date <span class="text-red-500">*</span>
                      </label>
                      <Input v-model="leaveForm.end_date" type="date" :min="leaveForm.start_date" required />
                    </div>
                  </div>

                  <!-- Duration Pill -->
                  <div class="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900">
                    <div class="flex items-center justify-between font-medium">
                      <span>Total Duration:</span>
                      <strong class="text-sm font-bold text-teal-800">{{ calculatedLeaveDays }} Day(s)</strong>
                    </div>
                  </div>

                  <!-- Reason / Subject -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Reason / Subject <span class="text-red-500">*</span>
                    </label>
                    <Input
                      v-model="leaveForm.reason"
                      placeholder="e.g. Feeling unwell, Family emergency, Vacation"
                      required
                    />
                  </div>

                  <!-- Application Note / Description -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Application Note <span class="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <Textarea
                      v-model="leaveForm.application_description"
                      placeholder="Write your note or reason details here…"
                      rows="4"
                    />
                  </div>
                </div>

                <!-- Right Column: Live Formal Application Letter Preview -->
                <div class="space-y-2 lg:col-span-6">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-700">Application Preview</label>
                    <span class="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">Live Document</span>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs shadow-xs sm:p-5">
                    <div class="space-y-3 rounded-xl border border-slate-200 bg-white p-4 leading-relaxed text-slate-800 shadow-xs font-sans">
                      <!-- Quota info -->
                      <p class="font-medium text-slate-500 italic">
                        You have remaining <strong class="text-teal-700 font-bold">{{ selectedLeaveTypeObj?.remaining_days ?? 0 }}</strong> days
                      </p>

                      <!-- Subject -->
                      <p class="font-semibold text-slate-900">
                        <strong>Subject:</strong> Leave Application for <span class="text-teal-800">{{ leaveForm.reason || '[reason]' }}</span>
                      </p>

                      <!-- Salutation -->
                      <p>Dear <strong class="text-slate-900">{{ applicant.manager_name || 'Mamun Abdullah' }}</strong>,</p>

                      <!-- Body text -->
                      <p>
                        I am writing to formally request a
                        <strong class="text-teal-800">{{ selectedLeaveTypeObj?.leave_type || 'Casual Leave' }}</strong>
                        of absence from
                        <strong class="text-slate-900">{{ leaveForm.start_date ? formatDate(leaveForm.start_date) : '[Start Date]' }}</strong>
                        to
                        <strong class="text-slate-900">{{ leaveForm.end_date ? formatDate(leaveForm.end_date) : '[End Date]' }}</strong>.
                      </p>

                      <!-- Application Note -->
                      <p class="rounded-lg bg-slate-50 p-2.5 text-slate-700 italic border border-slate-100">
                        {{ leaveForm.application_description ? leaveForm.application_description : '[Application Note]' }}
                      </p>

                      <!-- Closing -->
                      <p>
                        I would appreciate your approval at the earliest convenience. Thank you for your consideration.
                      </p>

                      <!-- Signature Block -->
                      <div class="border-t border-slate-100 pt-3 text-slate-700 space-y-0.5">
                        <p>Best regards,</p>
                        <p class="font-bold text-slate-900">{{ applicant.name || 'Ignatious Rozario' }}</p>
                        <p class="text-slate-500">
                          <span v-if="applicant.designation">{{ applicant.designation }}, </span>
                          <span>{{ applicant.department || 'Information Technology (IT)' }}</span>
                        </p>
                        <p v-if="applicant.contact_number" class="text-slate-500 font-mono text-[11px]">
                          {{ applicant.contact_number }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter class="border-t border-slate-100 pt-4">
                <Button
                  type="submit"
                  class="w-full sm:w-auto sm:ml-auto gap-2 rounded-xl bg-teal-700 px-6 font-bold text-white hover:bg-teal-800"
                  :disabled="submitting || calculatedLeaveDays <= 0"
                >
                  <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
                  <Send v-else class="size-4" />
                  <span>{{ submitting ? 'Submitting…' : 'Submit Leave Application' }}</span>
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <!-- Overtime Application Form -->
          <TabsContent v-if="overtimeEligible" value="overtime" class="mt-4 space-y-4">
            <form @submit.prevent="handleApplyOvertime" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-600">Overtime Date</label>
                <Input v-model="otForm.request_date" type="date" required />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-600">Overtime Hours</label>
                <Input
                  v-model.number="otForm.hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder="e.g. 2.5"
                  required
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold uppercase tracking-wider text-slate-600">Start Time (Optional)</label>
                  <Input v-model="otForm.start_time" type="time" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold uppercase tracking-wider text-slate-600">End Time (Optional)</label>
                  <Input v-model="otForm.end_time" type="time" />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-600">Task / Reason</label>
                <Input v-model="otForm.reason" placeholder="e.g. Server maintenance, Emergency patient support" required />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-600">Notes (Optional)</label>
                <Textarea v-model="otForm.notes" placeholder="Additional details regarding overtime work…" rows="3" />
              </div>

              <DialogFooter class="pt-4">
                <Button
                  type="submit"
                  class="w-full gap-2 rounded-xl bg-teal-700 font-bold text-white hover:bg-teal-800"
                  :disabled="submitting || otForm.hours <= 0"
                >
                  <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
                  <Send v-else class="size-4" />
                  <span>{{ submitting ? 'Submitting…' : 'Submit Overtime Request' }}</span>
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <!-- Cancel Confirmation Dialog -->
    <AlertDialog v-model:open="cancelDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Application</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this pending {{ cancelTarget?.type_name || 'application' }}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="cancelingId !== null">Keep Application</AlertDialogCancel>
          <AlertDialogAction
            class="bg-rose-600 text-white hover:bg-rose-700"
            :disabled="cancelingId !== null"
            @click="handleCancelRequest"
          >
            <LoaderCircle v-if="cancelingId !== null" class="mr-1.5 size-4 animate-spin" />
            <span>{{ cancelingId !== null ? 'Cancelling…' : 'Yes, Cancel Application' }}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
</template>
