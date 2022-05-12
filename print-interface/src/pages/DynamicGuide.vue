<template>
  <Step
    :badge-text="'Guia Prático'"
    :step-text="'Uma maneira mais fácil de se localizar'"
  >
    <p class="paragraph mb-4">
      O Guia Prático é um guia gerado <u class="underline-main">dinamicamente</u> de acordo com <u class="underline-main">suas
      preferências</u>. Basta responder algumas perguntinhas sobre seus interesses
      na Bett que ele será enviado <u class="underline-main">personalizado</u> e diretamente para o seu e-mail.
      Para mais informações, <u class="underline-main">basta acessar o QRCode abaixo.</u>
    </p>
    <div class="wrapper-image">
      <img
        src="../../static/mapa-bett.svg"
        alt="Exemplo de guia personalizado da Bett"
        style="width: 45%">
      <img
      src="../../static/mapa-only-qrcode.svg"
      alt="QRCode para o guia personalizado da Bett"
      style="width: 45%">
    </div>
    <button
      class="button-main"
      @click="$emit('next')"
      style="align-self: flex-end"
    >
      Continuar
    </button>
  </Step>
</template>

<script>
import Step from '../components/Step.vue'
export default {
  components: {
    Step
  },
  methods: {
  }
}
</script>

<style scoped>
</style>
