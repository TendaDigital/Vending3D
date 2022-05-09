<template>
  <div class="column bgc-light-aqua wrapper-content">
    <img
      class="wrapper-image mb-4"
      src="../../static/frase-que-nos-une.svg"
      alt="Imageem com o texto 'Sempre tem algo que nos une'"
    >
    <h1 class="title-main">Seja bem-vindo! Vamos começar?</h1>
    <button class="button-main mt-4" @click="$emit('start')">
      Escolher minha impressão 3D
    </button>
  </div>
</template>

<script>
export default {}
</script>

<style scoped>
.wrapper-image {
  width: 75%;
}
</style>
