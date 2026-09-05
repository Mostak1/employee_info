<script setup>
import { DropdownMenuSeparator as DropdownMenuSeparatorPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})
</script>

<template>
  <DropdownMenuSeparatorPrimitive v-bind="$attrs" :class="cn('-mx-1 my-1 h-px bg-slate-100', props.class)" />
</template>
