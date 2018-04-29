<template>
  <div class="flex row flex-wrap align-center justify-center scroll-y" v-loading="!objects">
    <ObjectViewer
      v-for="object in objects"
      :key="object.name"
      :object="object"
      class="ma-2"
    ></ObjectViewer>
  </div>
</template>

<script>

import axios from 'axios'

import ObjectViewer from './ObjectViewer'

export default {
  name: 'ObjectListing',

  components: {
    ObjectViewer,
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