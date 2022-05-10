<template>
  <div class="column bgc-light-aqua wrapper-content align-start">
    <Badge>
      Tempo aproximado: <b>4min</b>
    </Badge>
    <div class="mt-4">
      <h1 class="title-main">Pronto para criar seu brinde impresso em 3D?</h1>
      <h2 class="subtitle-main mt-4">E um guia prático da Bett!</h2>
    </div>
    <button
      class="button-main"
      @click="$emit('next')"
      style="margin-top: 100px">
      Estou pronto!
    </button>
    <img
      src="../../static/layers-principal-verde.png"
      alt="Ícone da Layers Colorido"
      style="  width: 140px; position: absolute; bottom: 70px; left: 70px"
    >
  </div>
</template>

<script>
import Badge from '../components/Badge.vue'
export default {
  components: {
    Badge
  }
}
</script>

<style scoped>
</style>
