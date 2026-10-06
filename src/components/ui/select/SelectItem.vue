<script setup>
import { Check } from '@lucide/vue'
import { SelectItem as SelectItemPrimitive, SelectItemIndicator, SelectItemText, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  value: { type: [String, Number, Object], required: true },
  disabled: { type: Boolean, required: false },
  textValue: { type: String, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItemPrimitive
    v-bind="forwardedProps"
    :class="cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm text-slate-800 outline-none transition-colors hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class,
    )"
  >
    <span class="absolute left-2.5 flex size-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="size-4 text-teal-600" />
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItemPrimitive>
</template>
