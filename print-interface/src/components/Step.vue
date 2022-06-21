<template>
  <div class="column bgc-light-aqua wrapper-content align-start">
    <Badge>
      {{badgeText}}
    </Badge>
    <h1 class="step-title mb-4">{{stepText}}</h1>
    <slot />
  </div>
</template>

<script>
import Badge from './Badge.vue'
export default {
  name: 'Step',
  components: {
    Badge
  },
  props: {
    badgeText: {
      required: true,
      type: String
    },
    stepText: {
      type: String
    }
  }
}
</script>

<style>

</style>
