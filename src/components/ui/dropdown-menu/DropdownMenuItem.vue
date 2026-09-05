<script setup>
import { DropdownMenuItem as DropdownMenuItemPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
  inset: { type: Boolean, default: false },
})
</script>

<template>
  <DropdownMenuItemPrimitive
    v-bind="$attrs"
    :data-inset="props.inset ? '' : undefined"
    :class="cn('relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none transition-colors focus:bg-teal-50 focus:text-teal-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50', props.inset && 'pl-8', props.class)"
  >
    <slot />
  </DropdownMenuItemPrimitive>
</template>
