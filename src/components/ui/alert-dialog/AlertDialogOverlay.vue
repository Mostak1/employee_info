<script setup>
import { AlertDialogOverlay } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: [String, Array, Object], default: '' } })
</script>

<template>
  <AlertDialogOverlay v-bind="$attrs" :class="cn('fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', props.class)" />
</template>
