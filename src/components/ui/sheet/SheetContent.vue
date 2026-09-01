<script setup>
import { DialogClose, DialogContent } from 'reka-ui'
import { cn } from '@/lib/utils'
import SheetOverlay from './SheetOverlay.vue'
import SheetPortal from './SheetPortal.vue'

const props = defineProps({
  side: { type: String, default: 'bottom' },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
})

const sideClasses = {
  top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom: 'inset-x-0 bottom-0 border-t rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
  right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
}
</script>

<template>
  <SheetPortal>
    <SheetOverlay />
    <DialogContent
      v-bind="$attrs"
      :class="cn('fixed z-50 flex max-h-[90vh] w-full flex-col gap-4 overflow-y-auto bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-300 data-[state=open]:duration-500', sideClasses[props.side] || sideClasses.bottom, props.class)"
    >
      <slot />
      <DialogClose class="absolute right-4 top-4 rounded-sm p-1 text-xl leading-none opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Close">
        <span aria-hidden="true">×</span>
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </SheetPortal>
</template>
