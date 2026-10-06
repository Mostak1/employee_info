<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  variant: { type: String, default: 'default' },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})

const variants = {
  default: 'border-transparent bg-teal-600 text-white',
  secondary: 'border-transparent bg-slate-100 text-slate-700',
  outline: 'border-slate-200 bg-transparent text-slate-700',
  destructive: 'border-transparent bg-red-600 text-white',
}
</script>

<template>
  <span :class="cn('inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[props.variant] || variants.default, props.class)">
    <slot />
  </span>
</template>
