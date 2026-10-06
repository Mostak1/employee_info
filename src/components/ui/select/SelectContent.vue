<script setup>
import { SelectContent as SelectContentPrimitive, SelectPortal, SelectViewport, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  forceMount: { type: Boolean, required: false },
  position: { type: String, required: false, default: 'popper' },
  side: { type: String, required: false, default: 'bottom' },
  sideOffset: { type: Number, required: false, default: 4 },
  align: { type: String, required: false, default: 'start' },
  alignOffset: { type: Number, required: false, default: 0 },
  avoidCollisions: { type: Boolean, required: false, default: true },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
  portal: { type: Boolean, default: true },
})
const emits = defineEmits(['closeAutoFocus', 'escapeKeyDown', 'pointerDownOutside'])

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <component :is="props.portal ? SelectPortal : 'div'">
    <SelectContentPrimitive
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(
        'relative z-[100] max-h-80 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class,
      )"
    >
      <SelectViewport
        :class="cn(
          'p-1.5',
          position === 'popper' &&
            'h-[var(--reka-select-trigger-height)] w-full min-w-[var(--reka-select-trigger-width)]',
        )"
      >
        <slot />
      </SelectViewport>
    </SelectContentPrimitive>
  </component>
</template>
