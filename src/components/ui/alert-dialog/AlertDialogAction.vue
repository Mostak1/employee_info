<script setup>
import { AlertDialogAction } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '../button'
const props = defineProps({ class: { type: [String, Array, Object], default: '' } })
</script>

<template><AlertDialogAction v-bind="$attrs" :class="cn(buttonVariants({ variant: 'destructive' }), props.class)"><slot /></AlertDialogAction></template>
