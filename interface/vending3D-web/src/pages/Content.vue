<template>

  <div v-if="this.stage=='form'" class="column">
      <Form
         @return="handleReturn()"
         @print="handlePrint()"
      ></Form>
    </div>
    <div v-else class="column">
      <ObjectViewer
        v-if="selectedObject"
        class="flex"
        :object="selectedObject"
        :key="selectedObject.name"
        :stage="this.stage"
        @confirm="handleConfirm()"
        @finish="handleFinish()"
        @clean="handleClean()"
      ></ObjectViewer>
      <div v-else class="flex row align-center justify-center">
        <span class="grey--text">Selecione algum objeto para visualizar</span>
      </div>
      
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
      selectedObject: null,
      stage: 'initial',
    }
  },
  methods: {
    handleConfirm () {
      this.stage = 'form';
    },

    handleReturn () {
      this.stage = 'initial';
    },

    handlePrint () {
      this.stage = 'print'
    },

    handleFinish () {
      this.stage = 'finish'
    },

    handleClean () {
      this.stage = 'initial'
    }

  }
}
</script>

<style scoped>

.listing {
   height: 360px;
   background: #F0F0F0;
}

</style>
