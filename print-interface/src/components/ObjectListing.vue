<template>
  <div class="row object-list flex-wrap align-center justify-center" v-loading="!objects">
    <ObjectCard
      v-for="object in objects"
      v-if="!belongsToBlackList(object.name)"
      :key="object.name"
      :object="object"
      class="ma-2 elevate-2"
      :selected="selected == object"
      @click="$emit('select', object)"
    ></ObjectCard>
    <el-button class="elevate-2" size="large" @click="showSecretParts = !showSecretParts">...</el-button>
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
      blackList: ['bagHolder', 'dino', 'marvin'],
      showSecretParts: false,
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

    belongsToBlackList(name) {
      if(this.showSecretParts){
        return false
      }else{
        return this.blackList.includes(name)
      }
    }
  },
}

</script>

<style scoped>

.object-list {
  z-index: 250;
  overflow: auto;
  padding: 2% 2.5%;
  box-shadow: 0px 5px 26px -4px rgba(0, 0, 0, 0.6) !important;
  border-top: 5px solid rgba(0, 0, 0, 0.6);
}

</style>
