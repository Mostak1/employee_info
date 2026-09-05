<script setup>
import { DropdownMenuLabel as DropdownMenuLabelPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})
</script>

<template>
  <DropdownMenuLabelPrimitive v-bind="$attrs" :class="cn('px-2 py-1.5 text-sm font-semibold', props.class)">
    <slot />
  </DropdownMenuLabelPrimitive>
</template>
