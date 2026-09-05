<script setup>
import { AlertDialogDescription } from 'reka-ui'
import { cn } from '@/lib/utils'
const props = defineProps({ class: { type: [String, Array, Object], default: '' } })
</script>

<template><AlertDialogDescription v-bind="$attrs" :class="cn('text-sm text-slate-500', props.class)"><slot /></AlertDialogDescription></template>
