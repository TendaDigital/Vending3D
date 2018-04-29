<template>
  <div class="column">
    <ObjectViewer
      v-if="selectedObject"
      class="flex"
      :object="selectedObject"
      :key="selectedObject.name"
    ></ObjectViewer>
    
    <ObjectListing
      class="listing elevate-3"
      :selected="selectedObject"
      @select="selectedObject = $event"
    ></ObjectListing>
  </div>
</template>

<script>
import Form from '../components/Form'
import ObjectViewer from '../components/ObjectViewer'
import ObjectListing from '../components/ObjectListing'

export default {
  name: 'Content',
  components: {
    Form,
    ObjectViewer,
    ObjectListing,
  },
  
  data() {
    return {
      selectedObject: null
    }
  },
}
</script>

<style scoped>

.listing {
   height: 360px;
   background: #F0F0F0;
}

</style>
