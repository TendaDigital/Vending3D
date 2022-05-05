<template>

  <transition name="fade" mode="out-in" @finish="handleFinish">
    <div v-if="this.stage=='form'" class="column" key="form">
      <TypeformForms
        @cancel="handleCancel"
        @print="handlePrint($event)"
      ></TypeformForms>
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
        class="listing elevate-3 mid-height"
        :selected="selectedObject"
        @select="handleSelect"
      ></ObjectListing>
    </div>
  </transition>

</template>

<script>
import axios from 'axios'
import Form from '../components/Form'
import ObjectViewer from '../components/ObjectViewer'
import ObjectListing from '../components/ObjectListing'
import TypeformForms from '../components/TypeformForms.vue'

export default {
  name: 'Content',
  components: {
    Form,
    ObjectViewer,
    ObjectListing,
    TypeformForms
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

    handleCancel: function () {
      this.stage = 'initial';
    },

    handlePrint: async function (taskOwner) {
      this.stage = 'print'
      try {
        const response = await axios.get(`tasks/print/${this.selectedObject.name}/?description=${taskOwner}`)
        this.printId = response.data.id
        this.printing = true
      } catch (error) {
        console.error(error)
      }
      this.handleFinish()
      setTimeout(this.handleClean, 3000)
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
   height: max(180px, 10%);
   background: #F0F0F0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .1s;
}

.fade-enter, .fade-leave-to {
  opacity: 0.5;
}

.mid-height {
  height: 50%;
}

</style>
