<template>
  <Step :badge-text="'Hora de escolher seu brinde!'" style="padding-bottom: 0px">
    <!-- <transition name="fade" mode="out-in" @finish="handleFinish"> -->
      <div
        v-if="currentStep === 1"
        class="column"
        key="viewer"
        style="width: 100%; height: 100%;"
      >
        <ObjectViewer
          :object="selectedObject"
          :key="selectedObject.name"
          :stage="this.stage"
          :payload="this.formData"
          @confirm="$emit('confirm', selectedObject)"
          @finish="handleFinish"
          @clean="handleClean"
          style="width: 100vw; height: 100%; align-self: center"
        />
        <button
          class="button-change"
          style="position: absolute; bottom: 200px; align-self: center; z-index: 300;"
          @click="currentStep--"
        >Trocar</button>
      </div>

        <ObjectListing
          v-show="currentStep === 0"
          class="listing elevate-3 mid-height"
          :selected="selectedObject"
          @select="handleSelect"
          style="width: 100vw; height: 100%; align-self: center"
        ></ObjectListing>
    <!-- </transition> -->
    <button
      class="button-main mt-4"
      style="margin-bottom: 70px"
      @click="nextStep"
      :disabled="isContinueDisabled"
    >Continuar</button>
  </Step>
</template>

<script>
import axios from 'axios'
import Form from '../components/Form'
import ObjectViewer from '../components/ObjectViewer'
import ObjectListing from '../components/ObjectListing'
import Step from '../components/Step.vue'

export default {
  name: 'Content',
  components: {
    Form,
    ObjectViewer,
    ObjectListing,
    Step
  },

  data () {
    return {
      selectedObject: null,
      stage: 'initial',
      formData: null,
      currentStep: 0
    }
  },
  methods: {
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
      console.log(payload)
      this.handleClean()
      this.selectedObject = payload
    },
    nextStep () {
      if (this.currentStep === 1) {
        this.$emit('confirm', this.selectedObject)
        this.resetUserSelection()
        return
      }
      this.currentStep++
    },
    resetUserSelection () {
      this.selectedObject = null
      this.currentStep = 0
    }
  },
  computed: {
    isContinueDisabled () {
      return this.selectedObject === null
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
