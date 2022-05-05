<template>
  <div
    @click="$emit('click')"
    class="object-viewer column align-center justify-center"
    :class="{selected: selected}">

    <!-- Text Viewer -->
    <div v-if="viewMethod == 'text'" class="viewer-text">
      {{object.name}}
    </div>
    <div v-else-if="viewMethod == 'img'" class="viewer-img">
      <img :src="imgPath">
    </div>
  </div>
</template>

<script>

import Axios from 'axios'

export default {
  name: 'ObjectCard',

  props: {
    object: {
      type: Object,
      required: true,
    },

    selected: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    viewMethod() {
      if (this.object.files.png) {
        return 'img'
      } else {
        return 'text'
      }
    },

    imgPath() {
      return Axios.defaults.baseURL+'/objects/files/' + this.object.files.png
    },
  },

  methods: {

  },
}

</script>

<style scoped>
.object-viewer {
  background: #FFF;
  height: 120px;
  width: 120px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.3s;
}

.object-viewer.selected {
  background: #5ef14d;
}

.viewer-text {
  color: #5ef14d;
  font-size: 40px;
}

.viewer-img {
  width: 100%;
  height: 100%;
}

.viewer-img > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}
</style>
