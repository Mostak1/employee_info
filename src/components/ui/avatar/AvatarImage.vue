<script setup>
import { AvatarImage as AvatarImagePrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})
</script>

<template>
  <AvatarImagePrimitive v-bind="$attrs" :class="cn('aspect-square size-full object-cover', props.class)" />
</template>
