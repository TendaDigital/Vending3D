<template>
  <div
    class="object-viewer column light-blue pa-1 elevate-2 align-center justify-center"
    style="border-radius: 4px;">

    <!-- Text Viewer -->
    <div v-if="viewMethod == 'text'" class="viewer-text">
      {{object.name}}
    </div>

    <div v-else-if="viewMethod == 'stl'">
      <ModelStl src="static/models/stl/slotted_disk.stl"></ModelStl>
    </div>
  </div>
</template>

<script>

import {ModelStl} from 'vue-3d-model'

export default {
  name: 'ObjectViewer',

  components: {
    ModelStl,
  },

  props: {
    object: {
      type: Object,
      required: true,
    },
  },

  computed: {
    viewMethod() {
      if (this.object.files.stl) {
        return 'stl'
      } else if (this.object.files.jpeg || this.object.files.png || this.object.files.jpg) {
        return 'img'
      } else {
        return 'text'
      }
    },
  },

  methods: {

  },
}

</script>

<style scoped>
.object-viewer {
  height: 200px;
  width: 200px;
}

.viewer-text {
  color: #FFF;
  font-size: 40px;
}
</style>