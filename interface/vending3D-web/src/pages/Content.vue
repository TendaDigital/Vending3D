<template>
  <div class="content">
    <ObjectListing></ObjectListing>
  </div>
</template>

<script>
import Form from '../components/Form'
import ObjectListing from '../components/ObjectListing'

export default {
  name: 'Content',
  components: {
    Form,
    ObjectListing,
  },
  
  created() {},
}
</script>

<style scoped>
.content {
  height: 100%;
  flex-grow: 4;
  
}

</style>
