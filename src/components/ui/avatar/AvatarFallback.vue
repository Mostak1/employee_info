<script setup>
import { AvatarFallback as AvatarFallbackPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})
</script>

<template>
  <AvatarFallbackPrimitive v-bind="$attrs" :class="cn('flex size-full items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white', props.class)">
    <slot />
  </AvatarFallbackPrimitive>
</template>
