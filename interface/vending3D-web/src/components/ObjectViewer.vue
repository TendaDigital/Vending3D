<template>
  <div class="column align-center justify-center" v-loading="loading">
    <div class="info-panel row align-center px-4">
      <div class="display-3 align-center row grey--text">
        <v-icon size="48">layers</v-icon>
        <span class="ml-3">{{objectName}}</span>
      </div>
      <div class="flex"></div>
      <el-button v-if="!confirming" type="success" size="large" @click="confirming = true">Imprimir</el-button>
      <el-button v-else-if="!printing" type="primary" size="large" @click="print()">Clique para confirmar</el-button>
      <span v-else class="light-green--text" @click="resetPrint()"><v-icon>check</v-icon> enviado para fila de impressão</span>
    </div>
    <ModelStl
      v-if="stlPath"
      class="flex"
      @on-load="onLoad()"
      @on-mousedown="stopRotating()"
      :position="position"
      :rotation="rotation"
      :src="stlPath"
    ></ModelStl>
  </div>
</template>

<script>

import axios from 'axios'

import {ModelStl} from 'vue-3d-model'

export default {
  name: 'ObjectViewer',

  components: {
    ModelStl,
  },

  props: {
    object: {
      type: Object,
      required: true,
    },

    payload: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      loading: true,
      objects: null,
      confirming: false,
      printing: false,
      autoRotate: true,
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      position: {
        x: 0,
        y: 0,
        z: -20,
      },

      // cameraPosition: {
      //   x: 
      // },
    }
  },

  computed: {
    stlPath() {
      return this.object.files.png ? 'http://localhost:9077/objects/files/' + this.object.files.stl : null
    },

    objectName() {
      if (this.object.name.length < 2) {
        return this.object.name.toUpperCase()
      }

      return this.object.name
    },
  },

  created() {
    this.rotate()
  },

  methods: {
    onLoad () {
      this.loading = false
    },
    rotate () {
      if (!this.autoRotate) return;
      this.rotation.y -= 0.01;
      requestAnimationFrame( this.rotate );
    },

    stopRotating () {
      this.autoRotate = false
    },

    print() {
      axios.get('tasks/print/' + this.object.name, {params: this.payload}).then(() => {
        this.printing = true  
      })
    },

    resetPrint() {
      this.confirming = false
      this.printing = false
    }
  },
}

</script>

<style scoped>
.info-panel {
  height: 100px;
  width: 100%;
  background: #000000CC;
}
</style>