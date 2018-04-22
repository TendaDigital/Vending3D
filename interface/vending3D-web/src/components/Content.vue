<template>
  <div class="content">
    <Form/>
  </div>
</template>

<script>
import Form from './Form'


export default {
  name: 'Content',
   components: {
    Form
  },
  data () {
    return {
      
    }
  }
}
</script>

<style scoped>
.content {
  height: 100%;
  flex-grow: 4;
  
}

</style>
