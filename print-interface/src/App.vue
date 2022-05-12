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
    <TypeformForms
      v-if="showForms"
      :formId="formId"
      @final="handleNextStep('final')"
      @cancel="handleCancel"
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
      existingForms: {
        'school-worker': 'lKMPVx6u',
        'startup': 'pl3YPIe5'
      },
      jumpForms: false,
      formId: null,
      userIs: null,
      userName: '',
      needDynamicGuide: null
    }
  },
  methods: {
    handleNextStep (step) {
      this.stage = step
    },
    handleQualification (qualificationInfo) {
      const { youAre, hasDynamicGuide, userName } = qualificationInfo
      this.userIs = youAre
      this.userName = this.hydrateUserName(userName)
      this.needDynamicGuide = !hasDynamicGuide
      if (youAre === 'student') {
        this.jumpForms = true
        this.handleNextStep('choose')
        return
      }
      this.jumpForms = false
      this.formId = this.existingForms[youAre]
      this.handleNextStep('forms')
    },
    hydrateUserName (userName) {
      switch (this.userIs) {
        case 'student':
          return userName + ' 🧑‍🎓'
        case 'school-worker':
          return userName + ' 🏫'
        case 'startup-worker':
          return userName + ' 🚀'
      }
    },
    handleConfirmation (object) {
      this.printObject(object)
      if (this.jumpForms || !this.needDynamicGuide) {
        this.handleNextStep('final')
      } else {
        this.handleNextStep('forms')
      }
    },
    handleForms (from) {
      this.formId = this.existingForms[from]
      this.handleNextStep('forms')
    },
    async printObject (object) {
      let response
      try {
        response = await axios.get(`tasks/print/${object.name}/?description=${this.userName}`)
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
      this.jumpForms = false
      this.formId = null
      this.userIs = null
      this.userName = ''
      this.needDynamicGuide = null
    }
  },
  computed: {
    showForms () {
      return !this.jumpForms && this.stage === 'forms'
    }
  }
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
