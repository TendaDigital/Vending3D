<template>
  <div
    class="column align-center justify-center"
    style='height: 100%; overflow: hidden;'>
    <Cover
      v-show="this.stage === 'idle'"
      @next="handleNextStep('qualification')"
    />
    <Qualification
      v-show="this.stage === 'qualification'"
      @next="handleQualification($event)"
    />
    <Content
      v-show="this.stage === 'choose'"
      @confirm="handleConfirmation($event)"
      class='flex'
    />
    <BackCover
      v-if="this.stage === 'final'"
      @reset="handleReset"
    />
  </div>
</template>

<script>
import axios from 'axios'

import Cover from './pages/Cover.vue'
import Content from './pages/Content'
import Qualification from './pages/Qualification.vue'
import TypeformForms from './components/TypeformForms.vue'
import BackCover from './pages/BackCover.vue'

export default {
  name: 'App',
  components: {
    Cover,
    Content,
    Qualification,
    TypeformForms,
    BackCover
  },
  data () {
    return {
      stage: 'idle',
      userInfo: {}
    }
  },
  methods: {
    handleNextStep (step) {
      this.stage = step
    },
    handleQualification (qualificationInfo) {
      this.userInfo = { ...qualificationInfo }
      this.handleNextStep('choose')
    },
    handleConfirmation (object) {
      this.printObject(object)
      this.handleNextStep('final')
    },
    handleForms (from) {
      this.formId = this.existingForms[from]
      this.handleNextStep('forms')
    },
    async printObject (object) {
      let response
      try {
        response = await axios.post(`tasks/print/${object.name}/?description=${this.userInfo.userName}`,
          this.userInfo
        )
      } catch (error) {
        console.log(error)
      }
      return (response)
    },
    handleCancel () {
      this.handleReset()
    },
    handleReset () {
      this.handleNextStep('idle')
      this.userInfo = {}
    }
  },
  computed: {}
}
</script>
<style>
body {
  font-family: Ubuntu, Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB,
    Microsoft YaHei, SimSun, sans-serif;
  overflow: auto;
  font-weight: 400;
  padding: 0;
  margin: 0;
  height: 100%;
}
html {
  overflow-y: initial;
}

html,
body {
  height: 100%;
  min-height: 100%;
  position: relative;
  widows: 100%;
}

/*
  Webkit Scrollbar
*/
*::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
  overflow: hidden;
  background: transparent;
}

.native.win32 *::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
}

*::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
}
</style>
