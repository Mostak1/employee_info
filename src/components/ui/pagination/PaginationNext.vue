<script setup>
import { reactiveOmit } from '@vueuse/core'
import { ChevronRight } from '@lucide/vue'
import { PaginationNext as PaginationNextPrimitive, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '../button'

const props = defineProps({
  size: { type: String, default: 'default' },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationNextPrimitive
    data-slot="pagination-next"
    v-bind="forwarded"
    :class="cn(buttonVariants({ variant: 'outline', size: props.size }), 'gap-1 px-2.5 sm:pr-2.5', props.class)"
  >
    <slot>
      <span>Next</span>
      <ChevronRight />
    </slot>
  </PaginationNextPrimitive>
</template>
