<template>
  <div class="row flex-wrap align-center justify-center scroll-y" v-loading="!objects">
    <ObjectCard
      v-for="object in objects"
      :key="object.name"
      :object="object"
      class="ma-2 elevate-2"
      :selected="selected == object"
      @click="$emit('select', object)"
    ></ObjectCard>
  </div>
</template>

<script>

import axios from 'axios'

import ObjectCard from './ObjectCard'

export default {
  name: 'ObjectListing',

  components: {
    ObjectCard,
  },

  props: {
    selected: {
      type: Object,
    },
  },

  data() {
    return {
      objects: null,
    }
  },

  created() {
    this.fetch()
  },

  methods: {
    fetch() {
      axios.get('objects').then(res => {
        this.objects = res.data
      })
    },
  },
}

</script>

<style scoped>
</style>