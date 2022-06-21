<template>
  <Step :badge-text="'Um pouco sobre você'" :step-text="currentText">
    <template v-if="steps[0].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="text" class="input-main" v-model="requesterName" />
      </div>
    </template>
    <template v-if="steps[1].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="email" class="input-main" v-model="requesterMail" />
      </div>
    </template>
    <template v-if="steps[2].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="number" class="input-main" v-model="requesterPhone" />
      </div>
    </template>
    <template v-if="steps[3].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input
          autofocus
          type="text"
          class="input-main"
          v-model="requesterInstitution"
        />
      </div>
    </template>
    <template v-if="steps[4].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="text" class="input-main" v-model="requesterCity" />
      </div>
    </template>
    <template v-if="steps[5].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="text" class="input-main" v-model="requesterState" />
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
      requesterName: '',
      requesterMail: '',
      requesterPhone: '',
      requesterInstitution: '',
      requesterCity: '',
      requesterState: '',
      steps: [
        {
          badgeText: 'Um pouco sobre você',
          text: 'Qual é o seu nome e sobrenome?'
        },
        {
          badgeText: 'Um pouco sobre você',
          text: 'Qual é o seu email?'
        },
        {
          badgeText: 'Um pouco sobre você',
          text: 'Qual é o seu celular?'
        },
        {
          badgeText: 'Um pouco sobre você',
          text: 'Qual é o nome da sua instituição?'
        },
        {
          badgeText: 'Um pouco sobre você',
          text: 'Você é de qual estado?'
        },
        {
          badgeText: 'Um pouco sobre você',
          text: 'E de qual cidade?'
        }
      ]
    }
  },
  methods: {
    handleNextStep () {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++
      } else {
        const nextEvent = {
          name: cloneDeep(this.requesterName),
          mail: cloneDeep(this.requesterMail),
          phone: cloneDeep(this.requesterPhone),
          institution: cloneDeep(this.requesterInstitution),
          city: cloneDeep(this.requesterCity),
          state: cloneDeep(this.requesterState)
        }
        this.$emit('next', nextEvent)
        this.resetrequesterSelection()
      }
    },
    resetrequesterSelection () {
      this.currentStep = 0
      this.requesterName = ''
      this.requesterMail = ''
      this.requesterPhone = ''
      this.requesterInstitution = ''
      this.requesterCity = ''
      this.requesterState = ''
    }
  },
  computed: {
    currentText () {
      return this.currentStep < this.steps.length ? this.steps[this.currentStep].text : ''
    },
    isContinueDisabled () {
      if (this.currentStep === 0) {
        return this.requesterName === ''
      }
      if (this.currentStep === 1) {
        return this.requesterMail === ''
      }
      if (this.currentStep === 2) {
        return this.requesterPhone === ''
      }
      if (this.currentStep === 3) {
        return this.requesterInstitution === ''
      }
      if (this.currentStep === 4) {
        return this.requesterCity === ''
      }
      if (this.currentStep === 5) {
        return this.requesterState === ''
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
  color: var(--color-purple-dark);
}

.option-selector {
  display: inline-block;
  width: 40px;
  height: 40px;
  border-radius: 100%;
  background-color: var(--white);
  border: 2px solid var(--color-gray-light);
  transition: border 0.25s 0s ease;
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
