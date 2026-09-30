<template>
  <div>
    <!-- Floating Bottom Install Banner -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-6"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-6"
    >
      <aside
        v-if="canShowBanner"
        aria-label="Install Carenet HRM App"
        :class="[
          'fixed inset-x-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md transition-all',
          hasBottomNav ? 'bottom-20 md:bottom-6' : 'bottom-4 sm:bottom-6'
        ]"
      >
        <!-- App Icon & Details -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-teal-50 shadow-inner">
            <img
              :src="iconUrl"
              alt="Carenet HRM"
              class="size-full object-cover"
              @error="(e) => { e.target.src = fallbackIconUrl }"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-semibold text-slate-900 leading-tight">Carenet HRM</h3>
            <p class="truncate text-xs text-slate-500">Install app for faster access</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            size="sm"
            class="h-8 rounded-full bg-teal-700 px-4 text-xs font-semibold text-white shadow hover:bg-teal-800 transition"
            @click="promptInstall"
          >
            Install
          </Button>
          <button
            type="button"
            aria-label="Dismiss install prompt"
            class="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            @click="dismiss()"
          >
            <X class="size-4" />
          </button>
        </div>
      </aside>
    </Transition>

    <!-- iOS Step-by-Step Installation Modal -->
    <Dialog :open="showIOSInstructions" @update:open="(val) => { showIOSInstructions = val; if (!val) dismiss(30) }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="mx-auto mb-2 grid size-14 place-items-center rounded-2xl bg-teal-50">
            <img :src="iconUrl" alt="Carenet HRM" class="size-12 rounded-xl object-cover" />
          </div>
          <DialogTitle class="text-center text-lg font-bold text-slate-900">
            Install Carenet HRM
          </DialogTitle>
          <DialogDescription class="text-center text-sm text-slate-600">
            Install our Web App on your iPhone or iPad home screen for instant, offline-capable access.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 py-2 text-sm text-slate-700">
          <div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <div class="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-xs font-bold text-white">
              1
            </div>
            <div>
              <p class="font-medium text-slate-900">Tap the Share button</p>
              <p class="text-xs text-slate-500">Look for the <span class="inline-flex items-center font-medium text-slate-700"><Share class="inline size-3.5 mx-0.5" /> Share</span> icon in Safari's bottom toolbar.</p>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <div class="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-xs font-bold text-white">
              2
            </div>
            <div>
              <p class="font-medium text-slate-900">Select "Add to Home Screen"</p>
              <p class="text-xs text-slate-500">Scroll down in the share menu and tap <span class="inline-flex items-center font-medium text-slate-700"><PlusSquare class="inline size-3.5 mx-0.5" /> Add to Home Screen</span>.</p>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <div class="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-xs font-bold text-white">
              3
            </div>
            <div>
              <p class="font-medium text-slate-900">Confirm by tapping "Add"</p>
              <p class="text-xs text-slate-500">Tap <span class="font-semibold text-teal-700">Add</span> in the top right corner to finish.</p>
            </div>
          </div>
        </div>

        <DialogFooter class="sm:justify-center">
          <Button
            type="button"
            class="w-full bg-teal-700 text-white hover:bg-teal-800"
            @click="() => { showIOSInstructions = false; dismiss(30); }"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Browser Instructions Modal (Fallback for Desktop/Unsupported browsers) -->
    <Dialog :open="showGenericInstructions" @update:open="(val) => { showGenericInstructions = val; if (!val) dismiss(30) }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="mx-auto mb-2 grid size-14 place-items-center rounded-2xl bg-teal-50">
            <img :src="iconUrl" alt="Carenet HRM" class="size-12 rounded-xl object-cover" />
          </div>
          <DialogTitle class="text-center text-lg font-bold text-slate-900">
            Install Carenet HRM
          </DialogTitle>
          <DialogDescription class="text-center text-sm text-slate-600">
            You can install Carenet HRM directly to your desktop or mobile apps menu.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 py-2 text-sm text-slate-700">
          <div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <div class="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-xs font-bold text-white">
              1
            </div>
            <div>
              <p class="font-medium text-slate-900">Look for the Install icon in the address bar</p>
              <p class="text-xs text-slate-500">Click the <span class="font-medium text-slate-800">Install icon (⊕)</span> on the right side of the URL bar.</p>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <div class="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-xs font-bold text-white">
              2
            </div>
            <div>
              <p class="font-medium text-slate-900">Or use Browser Menu (⋮)</p>
              <p class="text-xs text-slate-500">Open menu $\rightarrow$ <span class="font-medium text-slate-800">"Save and share"</span> $\rightarrow$ <span class="font-semibold text-teal-700">"Install Carenet HRM"</span>.</p>
            </div>
          </div>
        </div>

        <DialogFooter class="sm:justify-center">
          <Button
            type="button"
            class="w-full bg-teal-700 text-white hover:bg-teal-800"
            @click="() => { showGenericInstructions = false; dismiss(30); }"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { X, Share, PlusSquare } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { usePwaInstall } from '@/composables/usePwaInstall'

const route = useRoute()
const hasBottomNav = computed(() => Boolean(route?.name && route.name !== 'login'))

const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '') + '/'
const iconUrl = computed(() => `${baseUrl}pwa-192x192.png`)
const fallbackIconUrl = computed(() => `${baseUrl}favicon.svg`)

const {
  canShowBanner,
  showIOSInstructions,
  showGenericInstructions,
  promptInstall,
  dismiss,
} = usePwaInstall()
</script>
