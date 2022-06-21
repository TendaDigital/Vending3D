<template>
  <div class="column wrapper-content bgc-light-aqua">
    <h3 class="subtitle-main mb-4">Sua impressão foi enviada para a fila de espera! Foi um prazer recebermos sua visita!</h3>
    <button class="button-main" @click="$emit('reset')">
      <v-icon>home</v-icon>
      Voltar para tela inicial
    </button>
  </div>
</template>

<script>
export default {

}
</script>

<style scoped>

</style>
