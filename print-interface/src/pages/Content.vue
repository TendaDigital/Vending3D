<template>

  <transition name="fade" mode="out-in">
    <div v-if="this.stage=='form'" class="column" key="form">
      <Form
        @return="handleReturn"
        @print="handlePrint"
      ></Form>
    </div>
    <div v-else class="column" key="viewer">
      <ObjectViewer
        v-if="selectedObject"
        class="flex"
        :object="selectedObject"
        :key="selectedObject.name"
        :stage="this.stage"
        :payload="this.formData"
        @confirm="handleConfirm"
        @finish="handleFinish"
        @clean="handleClean"
      ></ObjectViewer>
      <div v-else class="flex row align-center justify-center">
        <span class="grey--text">Selecione algum objeto para visualizar</span>
      </div>
      
      <ObjectListing
        class="listing elevate-3"
        :selected="selectedObject"
        @select="handleSelect"
      ></ObjectListing>
    </div>
  </transition>

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
      formData: null,
    }
  },
  methods: {
    handleConfirm: function () {
      this.stage = 'form';
    },

    handleReturn: function () {
      this.stage = 'initial';
    },

    handlePrint: function (payload) {

      this.formData = payload
      //console.log(this.formData.name)
      this.stage = 'print'
    },

    handleFinish: function () {
      this.stage = 'finish'
    },

    handleClean: function () {
      this.stage = 'initial'
    },

    handleSelect: function (payload) {
      this.handleClean()
      this.selectedObject = payload
    }
    

  }
}
</script>

<style scoped>

.listing {
   height: 50%;
   background: #F0F0F0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .1s;
}

.fade-enter, .fade-leave-to {
  opacity: 0.5;
}

</style>
