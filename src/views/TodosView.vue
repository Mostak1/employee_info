<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Archive, CalendarDays, Check, CheckCircle, ChevronsUpDown, Eye, Filter, LoaderCircle, MoreHorizontal, Pencil, Plus, RefreshCw } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Pagination, PaginationContent, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from 'reka-ui'
import RichTextEditor from '@/components/tiptap/RichTextEditor.vue'
import { runtimeRequest } from '../lib/api'
import { normalizeRichText, richTextToPlainText, sanitizeRichText } from '../lib/richText'

const todos = ref([])
const loading = ref(true)
const error = ref('')
const filterError = ref('')
const formError = ref('')
const filterOpen = ref(false)
const formOpen = ref(false)
const detailsOpen = ref(false)
const statusOpen = ref(false)
const archiveOpen = ref(false)
const saving = ref(false)
const statusSaving = ref(false)
const archiveSaving = ref(false)
const formMode = ref('create')
const selectedTodo = ref(null)
const statusTodo = ref(null)
const archiveTodo = ref(null)
const statusValue = ref('new')
const statusError = ref('')
const archiveError = ref('')
const permissions = ref({ can_add: false, can_edit: false, can_assign: false, can_filter_assigned_by_me: false })
const options = reactive({ statuses: {}, priorities: {}, assignees: [], assignable_assignees: [], date_range: null, default_date_range: null })
const defaultDateRange = ref({ start_date: '', end_date: '' })
const meta = ref({ current_page: 1, per_page: 20, total: 0, last_page: 1 })
const filters = reactive({ status: 'all', priority: 'all', start_date: '', end_date: '', assigned_to: 'all', assigned_by_me: false })
// Select components cannot use an empty-string item value. Keep a sentinel for
// the optional priority field and translate it to null for the API payload.
const form = reactive({ task: '', description: '', status: 'new', priority: 'none', start_date: '', end_date: '', estimated_hours: '', assigned_to: [] })

const statusEntries = computed(() => Object.entries(options.statuses || {}))
const priorityEntries = computed(() => Object.entries(options.priorities || {}))
const assigneeOptions = computed(() => {
  const seen = new Set()

  return (options.assignable_assignees || []).reduce((list, person) => {
    const id = Number(person?.id)
    if (!Number.isInteger(id) || seen.has(id)) return list

    const name = String(person?.name || '').trim()
    const employeeId = String(person?.employee_id || '').trim()
    const label = String(person?.label || `${name} (${employeeId || id})`).trim()

    seen.add(id)
    list.push({
      ...person,
      id,
      name,
      employee_id: employeeId,
      label,
      searchText: `${label} ${id}`,
    })
    return list
  }, [])
})
const filterAssigneeOptions = computed(() => {
  const seen = new Set()

  return (options.assignees || []).reduce((list, person) => {
    const id = Number(person?.id)
    if (!Number.isInteger(id) || seen.has(id)) return list

    seen.add(id)
    list.push({ ...person, id, label: String(person?.label || person?.name || id) })
    return list
  }, [])
})
const formTitle = computed(() => formMode.value === 'create' ? 'Add To Do' : 'Edit To Do')

function descriptionExcerpt(value) {
  const text = richTextToPlainText(value)
  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text
}

function formatDate(value) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function formatDateTime(value) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function badgeClass(type, value) {
  const classes = type === 'status'
    ? { new: 'bg-amber-100 text-amber-800 border-amber-200', in_progress: 'bg-blue-100 text-blue-800 border-blue-200', on_hold: 'bg-rose-100 text-rose-800 border-rose-200', completed: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    : { low: 'bg-slate-100 text-slate-700 border-slate-200', medium: 'bg-amber-100 text-amber-800 border-amber-200', high: 'bg-orange-100 text-orange-800 border-orange-200', urgent: 'bg-red-100 text-red-800 border-red-200' }
  return classes[value] || 'bg-slate-100 text-slate-700'
}

function validateDateRange(start, end) {
  if (start && end && start > end) return 'The start date must be before or equal to the end date.'
  return ''
}

function validateFilterDateRange(start, end) {
  if ((start && !end) || (!start && end)) return 'Select both start and end dates.'
  return validateDateRange(start, end)
}

async function loadTodos(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const params = { page, per_page: meta.value.per_page }
    if (filters.status !== 'all') params.status = filters.status
    if (filters.priority !== 'all') params.priority = filters.priority
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    if (filters.assigned_to !== 'all') params.assigned_to = filters.assigned_to
    if (filters.assigned_by_me) params.assigned_by_me = 1

    const { data } = await runtimeRequest('get', 'todos', { params })
    todos.value = data.todos || []
    permissions.value = { ...permissions.value, ...(data.permissions || {}) }
    Object.assign(options, data.filters || {})
    if (data.filters?.default_date_range) {
      defaultDateRange.value = { ...data.filters.default_date_range }
    }
    if (data.filters?.date_range) {
      filters.start_date = data.filters.date_range.start_date || ''
      filters.end_date = data.filters.date_range.end_date || ''
    }
    meta.value = { ...meta.value, ...(data.meta || {}) }
    return true
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Unable to load your To Do list.'
    return false
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  if (loading.value) return
  filterError.value = validateFilterDateRange(filters.start_date, filters.end_date)
  if (filterError.value) return
  if (await loadTodos(1)) filterOpen.value = false
}

async function resetFilters() {
  if (loading.value) return
  Object.assign(filters, {
    status: 'all',
    priority: 'all',
    start_date: defaultDateRange.value.start_date || '',
    end_date: defaultDateRange.value.end_date || '',
    assigned_to: 'all',
    assigned_by_me: false,
  })
  filterError.value = ''
  if (await loadTodos(1)) filterOpen.value = false
}

function resetForm() {
  Object.assign(form, { task: '', description: '', status: 'new', priority: 'none', start_date: '', end_date: '', estimated_hours: '', assigned_to: [] })
  formError.value = ''
}

function openCreate() {
  resetForm()
  formMode.value = 'create'
  formOpen.value = true
}

function openEdit(todo) {
  if (!todo.can_edit) return
  formError.value = ''
  formMode.value = 'edit'
  selectedTodo.value = todo
  Object.assign(form, {
    task: todo.task || '',
    description: todo.description || '',
    status: todo.status || 'new',
    priority: todo.priority || 'none',
    start_date: todo.start_date ? todo.start_date.slice(0, 10) : '',
    end_date: todo.end_date ? todo.end_date.slice(0, 10) : '',
    estimated_hours: todo.estimated_hours ?? '',
    assigned_to: (todo.assigned_to || []).map((person) => Number(person.id)).filter(Number.isInteger),
  })
  formOpen.value = true
}

function openDetails(todo) {
  selectedTodo.value = todo
  detailsOpen.value = true
}

function openChangeStatus(todo) {
  if (!todo.can_change_status) return
  statusTodo.value = todo
  statusValue.value = todo.status || 'new'
  statusError.value = ''
  statusOpen.value = true
}

async function saveStatus() {
  if (statusSaving.value || !statusTodo.value) return
  statusError.value = ''
  statusSaving.value = true
  try {
    await runtimeRequest('put', 'todo', {
      endpointParams: { id: statusTodo.value.id },
      data: { status: statusValue.value },
    })
    toast.success('To Do status updated')
    statusOpen.value = false
    await loadTodos(meta.value.current_page)
  } catch (requestError) {
    statusError.value = requestError.response?.data?.message || 'Unable to update the To Do status.'
  } finally {
    statusSaving.value = false
  }
}

function openArchive(todo) {
  if (!todo.can_archive) return
  archiveTodo.value = todo
  archiveError.value = ''
  archiveOpen.value = true
}

async function archiveTask() {
  if (archiveSaving.value || !archiveTodo.value) return
  archiveError.value = ''
  archiveSaving.value = true
  try {
    const page = meta.value.current_page
    await runtimeRequest('delete', 'todo', { endpointParams: { id: archiveTodo.value.id } })
    toast.success('To Do archived')
    archiveOpen.value = false
    await loadTodos(page)
    if (todos.value.length === 0 && page > 1 && meta.value.total > 0) {
      await loadTodos(page - 1)
    }
  } catch (requestError) {
    archiveError.value = requestError.response?.data?.message || 'Unable to archive this To Do.'
  } finally {
    archiveSaving.value = false
  }
}

async function saveTodo() {
  if (saving.value) return
  formError.value = ''
  if (!form.task.trim() || !form.start_date || (permissions.value.can_assign && !form.assigned_to.length)) {
    formError.value = permissions.value.can_assign && !form.assigned_to.length
      ? 'Task, assigned employee, and start date are required.'
      : 'Task and start date are required.'
    return
  }
  formError.value = validateDateRange(form.start_date, form.end_date)
  if (formError.value) return

  const payload = {
    task: form.task.trim(),
    description: normalizeRichText(form.description),
    status: form.status || null,
    priority: form.priority === 'none' ? null : (form.priority || null),
    start_date: form.start_date,
    end_date: form.end_date || null,
    estimated_hours: form.estimated_hours === '' ? null : Number(form.estimated_hours),
  }
  if (permissions.value.can_assign) {
    payload.assigned_to = form.assigned_to.map((id) => Number(id)).filter(Number.isInteger)
  }

  saving.value = true
  try {
    if (formMode.value === 'create') await runtimeRequest('post', 'todos', { data: payload })
    else await runtimeRequest('put', 'todo', {
      endpointParams: { id: selectedTodo.value.id },
      data: payload,
    })
    toast.success(formMode.value === 'create' ? 'To Do created' : 'To Do updated')
    formOpen.value = false
    await loadTodos(meta.value.current_page)
  } catch (requestError) {
    formError.value = requestError.response?.data?.message || 'Unable to save this To Do.'
  } finally {
    saving.value = false
  }
}

function nextPage(page) {
  if (!loading.value && page >= 1 && page <= meta.value.last_page) loadTodos(page)
}

onMounted(() => loadTodos())
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-teal-700">WORKFLOW</p>
        <h1 class="mt-1 text-3xl font-bold">To Do</h1>
        <!-- <p class="mt-1 text-sm text-slate-500">Tasks created by you or assigned to you.</p> -->
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="loading" @click="filterOpen = true"><Filter class="size-4" /> Filter</Button>
        <Button v-if="permissions.can_add" :disabled="loading" @click="openCreate"><Plus class="size-4" /> Add</Button>
      </div>
    </div>

    <Card v-if="error" class="mt-6 border-red-200 bg-red-50">
      <CardContent class="flex items-center justify-between gap-4 p-5 text-sm text-red-700">
        <span>{{ error }}</span>
        <Button variant="outline" size="sm" :disabled="loading" @click="loadTodos()"><RefreshCw class="size-4" /> Retry</Button>
      </CardContent>
    </Card>

    <div v-if="loading" class="mt-6 grid gap-4" role="status" aria-live="polite" aria-label="Loading To Do items">
      <div class="flex items-center gap-2 text-sm font-medium text-slate-600"><LoaderCircle class="size-4 animate-spin text-teal-700" aria-hidden="true" /><span>Loading To Do items…</span></div>
      <Skeleton v-for="index in 4" :key="index" class="h-36 rounded-xl" />
    </div>

    <template v-else-if="!error">
      <Card v-if="todos.length === 0" class="mt-6 border-dashed border-slate-300">
        <CardContent class="flex flex-col items-center gap-3 p-10 text-center text-sm text-slate-500">
          <CalendarDays class="size-8 text-slate-400" />
          <p>No To Do items match the selected filters.</p>
          <Button v-if="permissions.can_add" size="sm" @click="openCreate"><Plus class="size-4" /> Add a task</Button>
        </CardContent>
      </Card>

      <div v-else class="mt-6 space-y-3">
        <div class="grid gap-3 md:hidden">
          <Card v-for="todo in todos" :key="todo.id" class="shadow-sm">
            <CardContent class="p-4">
              <div class="flex min-w-0 items-start justify-between gap-3">
                <button class="min-w-0 flex-1 overflow-hidden text-left" @click="openDetails(todo)">
                  <p class="text-xs font-medium text-slate-500">{{ todo.task_id }}</p>
                  <p class="mt-1 max-w-full overflow-hidden break-words text-base font-semibold leading-snug text-slate-900 line-clamp-2">{{ todo.task }}</p>
                  <p v-if="descriptionExcerpt(todo.description)" class="mt-1 max-w-full overflow-hidden text-xs leading-5 text-slate-500 line-clamp-2">{{ descriptionExcerpt(todo.description) }}</p>
                </button>
                <Badge class="shrink-0" :class="badgeClass('status', todo.status)">{{ todo.status_label }}</Badge>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <Badge v-if="todo.priority" :class="badgeClass('priority', todo.priority)">{{ todo.priority_label }}</Badge>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Start date</p><p class="mt-1">{{ formatDate(todo.start_date) }}</p></div>
                <div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">End date</p><p class="mt-1">{{ formatDate(todo.end_date) }}</p></div>
              </div>
              <div class="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span class="truncate">Assigned to: {{ todo.assigned_to?.map((person) => person.name).join(', ') || 'Not provided' }}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-xs" aria-label="Open task actions"><MoreHorizontal class="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <DropdownMenuItem @select="openDetails(todo)"><Eye class="size-4" /> View</DropdownMenuItem>
                    <!-- <DropdownMenuSeparator v-if="todo.can_edit || todo.can_change_status || todo.can_archive" /> -->
                    <DropdownMenuItem v-if="todo.can_edit" @select="openEdit(todo)"><Pencil class="size-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem v-if="todo.can_change_status" @select="openChangeStatus(todo)"><CheckCircle class="size-4" /> Change status</DropdownMenuItem>
                    <DropdownMenuItem v-if="todo.can_archive" class="text-red-600 focus:bg-red-50 focus:text-red-700" @select="openArchive(todo)"><Archive class="size-4" /> Archive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card class="hidden overflow-hidden md:block">
          <CardHeader><CardTitle>To Do list</CardTitle></CardHeader>
          <CardContent class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  <tr><th class="px-5 py-3">Task</th><th class="whitespace-nowrap px-5 py-3">Status</th><th class="whitespace-nowrap px-5 py-3">Dates</th><th class="px-5 py-3">Assigned to</th><th class="px-5 py-3 text-right">Action</th></tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="todo in todos" :key="todo.id" class="hover:bg-slate-50">
                    <td class="max-w-sm px-5 py-4"><button class="text-left" @click="openDetails(todo)"><p class="text-xs text-slate-500">{{ todo.task_id }}</p><p class="mt-1 font-medium text-slate-900">{{ todo.task }}</p><Badge v-if="todo.priority" class="mt-2" :class="badgeClass('priority', todo.priority)">{{ todo.priority_label }}</Badge></button></td>
                    <td class="whitespace-nowrap px-5 py-4"><Badge :class="badgeClass('status', todo.status)">{{ todo.status_label }}</Badge></td>
                    <td class="whitespace-nowrap px-5 py-4 text-slate-600">{{ formatDate(todo.start_date) }}<span v-if="todo.end_date"> – {{ formatDate(todo.end_date) }}</span></td>
                    <td class="max-w-48 px-5 py-4 text-slate-600">{{ todo.assigned_to?.map((person) => person.name).join(', ') || 'Not provided' }}</td>
                    <td class="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="outline" size="sm" aria-label="Open task actions">Actions <MoreHorizontal class="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="w-44">
                          <DropdownMenuItem @select="openDetails(todo)"><Eye class="size-4" /> View</DropdownMenuItem>
                          <!-- <DropdownMenuSeparator v-if="todo.can_edit || todo.can_change_status || todo.can_archive" /> -->
                          <DropdownMenuItem v-if="todo.can_edit" @select="openEdit(todo)"><Pencil class="size-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem v-if="todo.can_change_status" @select="openChangeStatus(todo)"><CheckCircle class="size-4" /> Change status</DropdownMenuItem>
                          <DropdownMenuItem v-if="todo.can_archive" class="text-red-600 focus:bg-red-50 focus:text-red-700" @select="openArchive(todo)"><Archive class="size-4" /> Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div v-if="meta.last_page > 1" class="flex items-center justify-between text-sm text-slate-500">
          <span>{{ meta.total }} tasks</span>
          <Pagination
            :page="meta.current_page"
            :items-per-page="meta.per_page"
            :total="meta.total"
            :disabled="loading"
            class="mx-0 w-auto"
            @update:page="nextPage"
          >
            <PaginationContent class="gap-2">
              <PaginationPrevious size="sm" />
              <span class="whitespace-nowrap px-1" aria-live="polite">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
              <PaginationNext size="sm" />
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </template>

    <Sheet v-model:open="filterOpen">
      <SheetContent side="bottom" class="mx-auto max-h-[90vh] max-w-2xl rounded-t-3xl">
        <SheetHeader><SheetTitle>Filter To Do items</SheetTitle><SheetDescription>Filters are applied to tasks visible to your account.</SheetDescription></SheetHeader>
        <form class="grid gap-4" @submit.prevent="applyFilters">
          <div class="grid gap-4 sm:grid-cols-2">
            <label v-if="permissions.can_assign" class="grid gap-2 text-sm font-medium sm:col-span-2">Assigned employee
              <Select v-model="filters.assigned_to"><SelectTrigger><SelectValue placeholder="All employees" /></SelectTrigger><SelectContent :portal="false"><SelectItem value="all">All employees</SelectItem><SelectItem v-for="person in filterAssigneeOptions" :key="person.id" :value="String(person.id)">{{ person.label }}</SelectItem></SelectContent></Select>
            </label>
            <label class="grid gap-2 text-sm font-medium">Status
              <Select v-model="filters.status"><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent :portal="false"><SelectItem value="all">All statuses</SelectItem><SelectItem v-for="[value, label] in statusEntries" :key="value" :value="value">{{ label }}</SelectItem></SelectContent></Select>
            </label>
            <label class="grid gap-2 text-sm font-medium">Priority
              <Select v-model="filters.priority"><SelectTrigger><SelectValue placeholder="All priorities" /></SelectTrigger><SelectContent :portal="false"><SelectItem value="all">All priorities</SelectItem><SelectItem v-for="[value, label] in priorityEntries" :key="value" :value="value">{{ label }}</SelectItem></SelectContent></Select>
            </label>
            <label class="grid gap-2 text-sm font-medium">Start date <Input v-model="filters.start_date" type="date" /></label>
            <label class="grid gap-2 text-sm font-medium">End date <Input v-model="filters.end_date" type="date" /></label>
          </div>
          <label v-if="permissions.can_filter_assigned_by_me" class="flex items-center gap-2 text-sm"><input v-model="filters.assigned_by_me" type="checkbox" class="size-4 rounded border-slate-300 text-teal-700"> Only assigned by me</label>
          <p v-if="filterError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ filterError }}</p>
          <SheetFooter><Button type="submit" :disabled="loading"><LoaderCircle v-if="loading" class="size-4 animate-spin" aria-hidden="true" /> Apply</Button><Button type="button" variant="outline" :disabled="loading" @click="resetFilters">Reset</Button></SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <Dialog v-model:open="detailsOpen">
      <DialogContent class="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle class="!text-lg !leading-6 tracking-normal break-words pr-8">{{ selectedTodo?.task || 'To Do details' }}</DialogTitle><DialogDescription>{{ selectedTodo?.task_id }}</DialogDescription></DialogHeader>
        <div v-if="selectedTodo" class="grid gap-5 text-sm">
          <div class="flex flex-wrap gap-2"><Badge :class="badgeClass('status', selectedTodo.status)">{{ selectedTodo.status_label }}</Badge><Badge v-if="selectedTodo.priority" :class="badgeClass('priority', selectedTodo.priority)">{{ selectedTodo.priority_label }}</Badge></div>
          <div v-if="selectedTodo.description" class="break-words text-sm leading-6 text-slate-700 [&_a]:text-teal-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:my-2 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:my-2 [&_ul]:list-disc" v-html="sanitizeRichText(selectedTodo.description)" />
          <p v-else class="text-sm text-slate-500">No description provided.</p>
          <dl class="grid gap-4 sm:grid-cols-2"><div><dt class="text-xs font-semibold uppercase text-slate-500">Start date</dt><dd class="mt-1">{{ formatDateTime(selectedTodo.start_date) }}</dd></div><div><dt class="text-xs font-semibold uppercase text-slate-500">End date</dt><dd class="mt-1">{{ formatDateTime(selectedTodo.end_date) }}</dd></div><div><dt class="text-xs font-semibold uppercase text-slate-500">Estimated hours</dt><dd class="mt-1">{{ selectedTodo.estimated_hours || 'Not provided' }}</dd></div><div><dt class="text-xs font-semibold uppercase text-slate-500">Assigned by</dt><dd class="mt-1">{{ selectedTodo.assigned_by?.name || 'Not provided' }}</dd></div><div class="sm:col-span-2"><dt class="text-xs font-semibold uppercase text-slate-500">Assigned to</dt><dd class="mt-1">{{ selectedTodo.assigned_to?.map((person) => person.name).join(', ') || 'Not provided' }}</dd></div></dl>
          <Button v-if="selectedTodo.can_edit" class="w-full sm:w-auto" @click="detailsOpen = false; openEdit(selectedTodo)"><Pencil class="size-4" /> Edit task</Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="statusOpen">
      <DialogContent class="w-[calc(100%-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>{{ statusTodo?.task_id }} · {{ statusTodo?.task }}</DialogDescription>
        </DialogHeader>
        <form class="grid gap-4" @submit.prevent="saveStatus">
          <label class="grid gap-2 text-sm font-medium">Status
            <Select v-model="statusValue">
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent :portal="false"><SelectItem v-for="[value, label] in statusEntries" :key="value" :value="value">{{ label }}</SelectItem></SelectContent>
            </Select>
          </label>
          <p v-if="statusError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ statusError }}</p>
          <DialogFooter>
            <Button type="button" variant="outline" :disabled="statusSaving" @click="statusOpen = false">Cancel</Button>
            <Button type="submit" :disabled="statusSaving"><LoaderCircle v-if="statusSaving" class="size-4 animate-spin" aria-hidden="true" /> {{ statusSaving ? 'Updating…' : 'Update status' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="archiveOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this To Do?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove <span class="font-medium text-slate-700">{{ archiveTodo?.task || 'this task' }}</span> from the active To Do list. You can restore it later from the archived list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p v-if="archiveError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ archiveError }}</p>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="archiveSaving">Cancel</AlertDialogCancel>
          <AlertDialogAction :disabled="archiveSaving" @click.prevent="archiveTask"><LoaderCircle v-if="archiveSaving" class="size-4 animate-spin" aria-hidden="true" /> {{ archiveSaving ? 'Archiving…' : 'Archive' }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog v-model:open="formOpen">
      <DialogContent class="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{{ formTitle }}</DialogTitle><DialogDescription>Keep the task details and dates up to date.</DialogDescription></DialogHeader>
        <form class="grid gap-4" @submit.prevent="saveTodo">
          <label class="grid gap-2 text-sm font-medium">
            <span>Task <span class="text-red-600" aria-hidden="true">*</span></span>
            <Input v-model="form.task" required placeholder="What needs to be done?" />
          </label>

          <label v-if="permissions.can_assign" class="grid gap-2 text-sm font-medium">
            <span>Assigned to <span class="text-red-600" aria-hidden="true">*</span></span>
            <ComboboxRoot v-model="form.assigned_to" multiple open-on-click open-on-focus :reset-search-term-on-select="false" class="w-full">
              <ComboboxAnchor class="relative w-full">
                <ComboboxInput
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm font-normal outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-600"
                  :placeholder="form.assigned_to.length ? `${form.assigned_to.length} selected · Search to add more` : 'Search employees...'"
                  :aria-required="true"
                />
                <ComboboxTrigger class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 outline-none hover:text-slate-900" aria-label="Toggle employee list">
                  <ChevronsUpDown class="size-4" />
                </ComboboxTrigger>
              </ComboboxAnchor>
              <ComboboxPortal>
                <ComboboxContent class="z-[60] mt-1 w-[var(--reka-combobox-trigger-width)] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-lg" position="popper">
                  <ComboboxViewport class="max-h-56 p-1">
                    <ComboboxEmpty class="px-3 py-2 text-sm text-slate-500">No employees found.</ComboboxEmpty>
                    <ComboboxItem v-for="person in assigneeOptions" :key="person.id" :value="person.id" :text-value="person.searchText" class="relative flex cursor-default select-none items-center rounded-sm py-2 pl-9 pr-3 text-sm outline-none data-[highlighted]:bg-teal-50 data-[highlighted]:text-teal-900">
                      <ComboboxItemIndicator class="absolute left-2 flex size-4 items-center justify-center">
                        <Check class="size-4" />
                      </ComboboxItemIndicator>
                      <span class="truncate">{{ person.label }}</span>
                    </ComboboxItem>
                  </ComboboxViewport>
                </ComboboxContent>
              </ComboboxPortal>
            </ComboboxRoot>
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-2 text-sm font-medium">Priority
              <Select v-model="form.priority"><SelectTrigger><SelectValue placeholder="No priority" /></SelectTrigger><SelectContent :portal="false"><SelectItem value="none">No priority</SelectItem><SelectItem v-for="[value, label] in priorityEntries" :key="value" :value="value">{{ label }}</SelectItem></SelectContent></Select>
            </label>
            <label class="grid gap-2 text-sm font-medium">Status
              <Select v-model="form.status"><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent :portal="false"><SelectItem v-for="[value, label] in statusEntries" :key="value" :value="value">{{ label }}</SelectItem></SelectContent></Select>
            </label>
            <label class="grid gap-2 text-sm font-medium">
              <span>Start date <span class="text-red-600" aria-hidden="true">*</span></span>
              <Input v-model="form.start_date" required type="date" />
            </label>
            <label class="grid gap-2 text-sm font-medium">End date <span class="text-xs font-normal text-slate-500">(optional)</span> <Input v-model="form.end_date" type="date" /></label>
            <label class="grid gap-2 text-sm font-medium">Estimated hours <Input v-model="form.estimated_hours" type="number" min="0" step="0.25" /></label>
          </div>

          <label class="grid gap-2 text-sm font-medium">Description <RichTextEditor v-model="form.description" :disabled="saving" /></label>
          <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
          <DialogFooter><Button type="button" variant="outline" :disabled="saving" @click="formOpen = false">Cancel</Button><Button type="submit" :disabled="saving"><LoaderCircle v-if="saving" class="size-4 animate-spin" aria-hidden="true" /> {{ saving ? 'Saving…' : 'Save' }}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
