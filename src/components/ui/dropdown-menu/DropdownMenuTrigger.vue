<script setup>
import { DropdownMenuTrigger as DropdownMenuTriggerPrimitive } from 'reka-ui'
</script>

<template>
  <DropdownMenuTriggerPrimitive v-bind="$attrs">
    <slot />
  </DropdownMenuTriggerPrimitive>
</template>
