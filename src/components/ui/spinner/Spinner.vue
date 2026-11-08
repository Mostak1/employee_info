<script setup>
import { LoaderCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: [String, Object, Array],
    default: '',
  },
})
</script>

<template>
  <LoaderCircle
    role="status"
    aria-label="Loading"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>

