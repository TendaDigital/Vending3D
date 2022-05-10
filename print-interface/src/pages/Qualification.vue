<template>
      <Step :badge-text="'Um pouco sobre você'" :step-text="currentQuestion">
        <template v-if="steps[0].question === currentQuestion">
          <div class="wrapper-options" style="width: 100%; height: 100%">
            <div
              v-for="(option, index) in youAreOptions"
              :key="index"
              @click="selectYouAre(option.id)"
              class="row option-wrapper justify-between align-center mb-3"
              :class="selectedYouAre === option.id ? '-selected' : ''"
            >
              <p
                class="option-text mb-0"
                :class="selectedYouAre === option.id ? '-selected' : ''"
              >{{option.text}}</p>
              <span
                class="option-selector"
                :class="selectedYouAre === option.id ? '-selected' : ''"
              />
            </div>
          </div>
        </template>
        <template v-if="steps[1].question === currentQuestion">
          <div class="wrapper-options" style="width: 100%; height: 100%">
            <div
              v-for="(option, index) in dynamicGuideOptions"
              :key="index"
              class="row option-wrapper justify-between align-center mb-3"
              @click="selectDynamicGuide(option.id)"
              :class="hasDynamicGuide === option.id ? '-selected' : ''"
            >
              <p
                class="option-text mb-0"
                :class="hasDynamicGuide === option.id ? '-selected' : ''"
              >{{option.text}}</p>
              <span
                class="option-selector"
                :class="hasDynamicGuide === option.id ? '-selected' : ''"
              />
            </div>
          </div>
        </template>
        <template v-if="steps[2].question === currentQuestion">
          <div class="column" style="width: 100%; height: 100%;">
          <input autofocus type="text" class="input-main" v-model="userName">
          </div>
        </template>
        <button
          class="button-main"
          @click="handleNextStep"
          style="align-self: flex-end"
          :disabled="isContinueDisabled"
        >
          Continuar
        </button>
      </Step>
</template>

<script>
import Badge from '../components/Badge.vue'
import Step from '../components/Step.vue'
export default {
  components: {
    Badge,
    Step
  },
  data () {
    return {
      currentStep: 0,
      selectedYouAre: null,
      hasDynamicGuide: null,
      userName: '',
      steps: [
        {
          question: 'Você é...'
        },
        {
          question: 'Você já tem o Guia Prática da Bett?'
        },
        {
          question: 'Qual é o seu primeiro nome?'
        }
      ],
      youAreOptions: [
        {
          text: 'um estudante',
          id: 'student'
        },
        {
          text: 'de uma instituição de ensino',
          id: 'school-worker'
        },
        {
          text: 'de um fornecedor',
          id: 'startup'
        }
      ],
      dynamicGuideOptions: [
        {
          text: 'Já tenho sim!',
          id: 'yes'
        },
        {
          text: 'Ainda não!',
          id: 'no'
        },
        {
          text: 'O que é o Guia Prático?',
          id: 'what'
        }
      ]
    }
  },
  methods: {
    selectYouAre (option) {
      this.selectedYouAre = option
    },
    selectDynamicGuide (option) {
      this.hasDynamicGuide = option
    },
    handleNextStep () {
      if (this.selectedYouAre !== 'school-worker') {
        this.currentStep++
      }
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++
      } else {
        this.$emit('next', {
          youAre: this.selectedYouAre,
          hasDynamicGuide: this.hasDynamicGuide === 'yes',
          userName: this.userName
        })
        this.resetUserSelection()
      }
    },
    resetUserSelection () {
      this.currentStep = 0
      this.selectedYouAre = null
      this.hasDynamicGuide = null
      this.userName = ''
    }
  },
  computed: {
    currentQuestion () {
      return this.currentStep < this.steps.length ? this.steps[this.currentStep].question : ''
    },
    isContinueDisabled () {
      if (this.currentStep === 0) {
        return this.selectedYouAre === null
      }
      if (this.currentStep === 1) {
        return this.hasDynamicGuide === null
      }
      if (this.currentStep === 2) {
        return this.userName === ''
      }
    }
  }
}
</script>

<style scoped>
.option-wrapper {
  width: 100%;
  border: 2px solid var(--color-gray-light);
  background-color: var(--white);
  border-radius: 15px;
  padding: 15px 40px;
}
.option-wrapper.-selected {
  border-color: var(--color-purple-dark);
}

.option-text {
  display: inline;
  font-size: 25px;
  font-weight: bold;
  color: var(--color-gray-light);
}
.option-text.-selected {
  color: var(--color-purple-dark)
}

.option-selector {
  display: inline-block;
  width: 40px;
  height: 40px;
  border-radius: 100%;
  background-color: var(--white);
  border: 2px solid var(--color-gray-light);
  transition: border 0.25s 0s ease
}
.option-selector.-selected {
  border: 15px solid var(--color-purple-dark);
}

.input-main {
  width: 100%;
  border: 2px solid var(--color-gray-light);
  background-color: var(--white);
  padding: 10px 40px;
  border-radius: 15px;
  font-size: 25px;
  font-weight: 600;
}

.input-main:focus {
  outline: none !important;
  border: 2px solid var(--color-purple-dark);
}
</style>
