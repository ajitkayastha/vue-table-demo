<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  >
    <component
      :is="node[0]"
      v-for="(node, index) in icon"
      :key="index"
      v-bind="node[1]"
    />
  </svg>
</template>

<script>
export default {
  name: 'LucideIcon',
  props: {
    icon: {
      type: Array,
      required: true
    },
    size: {
      type: [Number, String],
      default: 14
    },
    strokeWidth: {
      type: [Number, String],
      default: 2
    }
  }
};
</script>
