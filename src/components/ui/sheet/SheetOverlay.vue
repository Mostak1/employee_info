<script setup>
import { DialogOverlay } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
})
</script>

<template>
  <DialogOverlay
    :class="cn('fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', props.class)"
  />
</template>
