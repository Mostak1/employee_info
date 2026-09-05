<script setup>
import { AvatarRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})
</script>

<template>
  <AvatarRoot v-bind="$attrs" :class="cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', props.class)">
    <slot />
  </AvatarRoot>
</template>
