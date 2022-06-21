<template>
      <Step :badge-text="'Um pouco sobre você'" :step-text="currentText">
        <template v-if="steps[0].text === currentText">
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
        <template v-if="steps[1].text === currentText">
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
        <div v-show="steps[2].text === currentText" class="column">
          <div class="wrapper-options" style="width: 100%; height: 100%">
            <p class="paragraph mb-4">
              O Guia Prático é um guia gerado <u class="underline-main">dinamicamente</u> de acordo com <u class="underline-main">suas
              preferências</u>. Basta responder algumas perguntinhas sobre seus interesses
              na Bett que ele será enviado <u class="underline-main">personalizado</u> e diretamente para o seu e-mail.
              Para mais informações, <u class="underline-main">basta acessar o QRCode abaixo.</u>
            </p>
            <div class="wrapper-image">
              <img
              src="../../static/mapa-only-qrcode.svg"
              alt="QRCode para o guia personalizado da Bett"
              style="width: 45%">
              <img
                src="../../static/mapa-bett.svg"
                alt="Exemplo de guia personalizado da Bett"
                style="width: 45%">
            </div>
          </div>
        </div>
        <template v-if="steps[3].text === currentText">
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
          Próximo
        </button>
      </Step>
</template>

<script>
import Badge from '../components/Badge.vue'
import Step from '../components/Step.vue'
import { cloneDeep } from 'lodash'
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
          badgeText: 'Um pouco sobre você',
          text: 'Você é...'
        },
        {
          badgeText: 'Um pouco sobre você',
          text: 'Você já tem o Guia Prático da Bett?'
        },
        {
          badgeText: 'Guia Prático',
          text: 'Uma maneira mais fácil de se localizar'
        },
        {
          badgeText: 'Um pouco sobre você',
          text: 'Qual é o seu primeiro nome?'
        }
      ],
      youAreOptions: [
        {
          text: 'um estudante',
          id: 'student'
        },
        {
          text: 'um colaborador em uma escola',
          id: 'school-worker'
        },
        {
          text: 'um expositor na Bett',
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
        this.currentStep++
      }
      if (this.selectedYouAre === 'school-worker' && this.hasDynamicGuide === 'yes') {
        this.currentStep++
      }
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++
      } else {
        const nextEvent = {
          youAre: cloneDeep(this.selectedYouAre),
          hasDynamicGuide: cloneDeep(this.hasDynamicGuide === 'yes'),
          userName: cloneDeep(this.userName)
        }
        this.$emit('next', nextEvent)
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
    currentText () {
      return this.currentStep < this.steps.length ? this.steps[this.currentStep].text : ''
    },
    isContinueDisabled () {
      if (this.currentStep === 0) {
        return this.selectedYouAre === null
      }
      if (this.currentStep === 1) {
        return this.hasDynamicGuide === null
      }
      if (this.currentStep === 3) {
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
