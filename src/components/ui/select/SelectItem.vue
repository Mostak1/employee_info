<script setup>
import { SelectItem as SelectItemPrimitive, SelectItemText } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})
</script>

<template>
  <SelectItemPrimitive v-bind="$attrs" :class="cn('relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-teal-50 focus:text-teal-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50', props.class)">
    <SelectItemText><slot /></SelectItemText>
  </SelectItemPrimitive>
</template>
