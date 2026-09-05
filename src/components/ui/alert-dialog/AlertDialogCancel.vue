<script setup>
import { AlertDialogCancel } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '../button'
const props = defineProps({ class: { type: [String, Array, Object], default: '' } })
</script>

<template><AlertDialogCancel v-bind="$attrs" :class="cn(buttonVariants({ variant: 'outline' }), props.class)"><slot /></AlertDialogCancel></template>
