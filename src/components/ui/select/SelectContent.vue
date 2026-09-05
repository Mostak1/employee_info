<script setup>
import { SelectContent as SelectContentPrimitive, SelectPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
  portal: { type: Boolean, default: true },
})
</script>

<template>
  <component :is="props.portal ? SelectPortal : 'div'">
    <SelectContentPrimitive v-bind="$attrs" :class="cn('relative z-50 max-h-72 min-w-32 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-md', props.class)">
      <slot />
    </SelectContentPrimitive>
  </component>
</template>
