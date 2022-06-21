<template>
  <Step :badge-text="'Um pouco sobre você'" :step-text="currentText">
    <template v-if="steps[0].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="text" class="input-main" v-model="userName" />
      </div>
    </template>
    <template v-if="steps[1].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="email" class="input-main" v-model="userMail" />
      </div>
    </template>
    <template v-if="steps[2].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="number" class="input-main" v-model="userPhone" />
      </div>
    </template>
    <template v-if="steps[3].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input
          autofocus
          type="text"
          class="input-main"
          v-model="userInstitution"
        />
      </div>
    </template>
    <template v-if="steps[4].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="text" class="input-main" v-model="userCity" />
      </div>
    </template>
    <template v-if="steps[5].text === currentText">
      <div class="column" style="width: 100%; height: 100%;">
        <input autofocus type="text" class="input-main" v-model="userState" />
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
      userName: '',
      userMail: '',
      userPhone: '',
      userInstitution: '',
      userCity: '',
      userState: '',
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
          userName: cloneDeep(this.userName),
          userMail: cloneDeep(this.userMail),
          userPhone: cloneDeep(this.userPhone),
          userInstitution: cloneDeep(this.userInstitution),
          userCity: cloneDeep(this.userCity),
          userState: cloneDeep(this.userState)
        }
        this.$emit('next', nextEvent)
        this.resetUserSelection()
      }
    },
    resetUserSelection () {
      this.currentStep = 0
      this.userName = ''
      this.userMail = ''
      this.userPhone = ''
      this.userInstitution = ''
      this.userCity = ''
      this.userState = ''
    }
  },
  computed: {
    currentText () {
      return this.currentStep < this.steps.length ? this.steps[this.currentStep].text : ''
    },
    isContinueDisabled () {
      if (this.currentStep === 0) {
        return this.userName === ''
      }
      if (this.currentStep === 1) {
        return this.userMail === ''
      }
      if (this.currentStep === 2) {
        return this.userPhone === ''
      }
      if (this.currentStep === 3) {
        return this.userInstitution === ''
      }
      if (this.currentStep === 4) {
        return this.userCity === ''
      }
      if (this.currentStep === 5) {
        return this.userState === ''
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
