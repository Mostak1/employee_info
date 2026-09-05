<script setup>
import { DropdownMenuContent as DropdownMenuContentPrimitive, DropdownMenuPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
  sideOffset: { type: [String, Number], default: 4 },
})
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContentPrimitive
      v-bind="$attrs"
      :side-offset="props.sideOffset"
      :class="cn('z-50 min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-lg outline-none data-[state=closed]:animate-out data-[state=open]:animate-in', props.class)"
    >
      <slot />
    </DropdownMenuContentPrimitive>
  </DropdownMenuPortal>
</template>
