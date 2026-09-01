<script setup>
import { DialogTitle } from 'reka-ui'
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
  <DialogTitle v-bind="$attrs" :class="cn('text-lg font-semibold text-foreground', props.class)">
    <slot />
  </DialogTitle>
</template>
