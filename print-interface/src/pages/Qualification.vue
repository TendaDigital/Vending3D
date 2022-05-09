<template>
  <div class="column wrapper-content bgc-light-aqua">
    <v-icon class="button-cancel" @click="$emit('cancel')">close</v-icon>
    <div>
      <h3 class="wrapper-question mb-4">
        Queremos te conhecer mais um pouco antes de terminarmos a impressão. De onde você veio?
      </h3>
      <div class="mb-2" v-for="(option, index) in options" :key="option.for">
        <button
          class="button-main -option"
          :class="from === option.for ? '-selected' : ''"
          @click="updateFrom(option.for)"
        >{{index + 1}}. {{option.text}}</button>
      </div>
      <button
        class="button-main -question mt-4"
        @click="handleNextQuestion(from)"
        :class="from === undefined ? '-disabled' : ''"
        :disabled="from == undefined">
        Próxima pergunta
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      from: undefined,
      options: [
        {
          for: 'school-student',
          text: 'Sou aluno de uma escola'
        },
        {
          for: 'school-worker',
          text: 'Sou funcionário de uma escola'
        },
        {
          for: 'startup',
          text: 'Sou funcionário de uma startup'
        }
      ]
    }
  },
  methods: {
    handleNextQuestion (from) {
      if (from === 'school-student') {
        this.$emit('final')
        return ''
      }
      this.$emit('forms', from)
    },
    updateFrom (origin) {
      this.from = origin
    }
  }
}
</script>

<style scoped>
.button-main {
  font-size: 18px;
  transition: transform .25s ease-in-out 0s;
}

.button-main:hover {
  transform: scale(1.05)
}

.button-main:active {
  transform: scale(.95)
}

.button-main.-option{
  background-color: var(--color-pink-light);
  border: 2px solid var(--color-pink-dark);
  padding: 2px 6px;
  border-radius: 4px;
}

.button-main.-option.-selected {
  background-color: var(--color-pink-dark);
}

.button-main.-question {
  background-color: var(--color-purple-light);
  border: 2px solid var(--color-purple-dark);
  border-radius: 4px;
  padding: 4px 8px;
  transition-property: background-color;
}

.button-main.-disabled {
  background-color: rgba(1, 1, 1, 0.25) !important;
  border: 2px solid rgba(1, 1, 1, 0.75) !important;
}

.button-main.-disabled:hover {
  transform: scale(1);
}

.button-main.-question:active {
  background-color: var(--color-purple-dark);
}

.button-cancel {
  position: absolute;
  z-index: 200;
  top:5%;
  right:5%;
}

.button-cancel:hover {
  cursor: pointer;
}
</style>
