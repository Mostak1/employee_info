<script setup>
import { SelectTrigger as SelectTriggerPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})
</script>

<template>
  <SelectTriggerPrimitive v-bind="$attrs" :class="cn('flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50', props.class)">
    <slot />
  </SelectTriggerPrimitive>
</template>
