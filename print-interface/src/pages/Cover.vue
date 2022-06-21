<template>
  <div class="column bgc-light-aqua wrapper-content align-start">
    <div class="mt-4">
      <h1 class="title-main">Pronto para criar seu brinde impresso em 3D?</h1>
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
      style="width: 140px; position: absolute; bottom: 70px; left: 70px;"
      @click="toggleWaitList"
    >
    <el-drawer
      :visible.sync="isWaitlistOpen"
      :with-header="false"
      size="90%"
    >
      <QueueList v-if="isWaitlistOpen"/>
    </el-drawer>
  </div>
</template>

<script>
import Badge from '../components/Badge.vue'
import QueueList from '../components/Sidebar.vue'
export default {
  components: {
    Badge,
    QueueList
  },
  data () {
    return {
      isWaitlistOpen: false
    }
  },
  methods: {
    toggleWaitList () {
      this.isWaitlistOpen = !this.isWaitlistOpen
    }
  }
}
</script>

<style scoped>
</style>
