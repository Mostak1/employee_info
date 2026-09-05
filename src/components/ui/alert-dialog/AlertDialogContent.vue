<script setup>
import { AlertDialogContent, AlertDialogPortal } from 'reka-ui'
import { cn } from '@/lib/utils'
import AlertDialogOverlay from './AlertDialogOverlay.vue'

const props = defineProps({ class: { type: [String, Array, Object], default: '' } })
</script>

<template>
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogContent v-bind="$attrs" :class="cn('fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', props.class)">
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
