<template>
  <div class="column align-center justify-center" style="position: relative;">
    <div class="info-panel row align-center px-4" style="height: 100px;">
      <div class="display-3 align-center row grey--text">
        <v-icon size="48">layers</v-icon>
        <span class="ml-3">{{objectName}}</span>
      </div>
      <div class="flex"></div>
      <el-button v-if="stage == 'initial'" type="success" size="large" @click="$emit('confirm')" style="background:transparent; border:none; color:transparent;">Imprimir</el-button>
      <el-button v-else-if="stage=='print'" type="primary" size="large" @click="print()">Clique para confirmar</el-button>
      <span v-else class="light-green--text" @click="resetPrint()"><v-icon>check</v-icon> enviado para fila de impressão</span>
    </div>
    <div
      ref="stlHolder"
      v-if="stlPath"
      class="stl-holder flex"
      style="width: 100%;">

      <ModelStl
        ref="stl"
        v-loading="loading"
        class="stl-model"
        :size="stlSize"
        @on-load="onLoad()"
        @on-mousedown="stopRotating()"
        :cameraPosition="cameraPosition"
        :cameraRotation="cameraRotation"
        :cameraLookAt="cameraLookAt"
        :cameraUp="cameraUp"
        :src="stlPath"
      ></ModelStl>
    </div>
    <img v-else :src="imgPath" class="flex" style="width: 100%;">

    <div style="position: absolute; bottom: 16px; right: 16px;">
      <v-btn v-if="!autoRotate" @click="startAutoRotate(true)" outline icon><v-icon>3d_rotation</v-icon></v-btn>
    </div>
  </div>
</template>

<script>

import {Matrix4, GridHelper} from 'three'
import axios from 'axios'

import {ModelStl} from 'vue-3d-model'

import {getSize, getCenter} from '../helpers/Util3D'

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

    stage: {
      type: String,
      required: true,
    }
  },

  data() {
    return {
      loading: false,
      objects: null,
      confirming: false,
      printing: false,
      autoRotate: true,
      cameraPosition: {
        x: 0, y: -50, z: 50
      },
      cameraRotation: {
        x: 0, y: 0, z: 0
      },
      cameraLookAt: {
        x: 0, y: 0, z: 0
      },
      cameraUp: {
        x: 0, y: 0, z: 1
      },

      stlSize: {
        width: 10,
        height: 10,
      },

      wrapper: null,
      body: null,
    }
  },

  computed: {
    stlPath() {
      return this.object.files.stl ? SERVER_URL + '/objects/files/' + this.object.files.stl : null
    },

    imgPath() {
      return this.object.files.png ? SERVER_URL + '/objects/files/' + this.object.files.png : null
    },

    objectName() {
      if (this.object.name.length < 2) {
        return this.object.name.toUpperCase()
      }

      return this.object.name
    },
  },

  created() {
    if (this.stlPath) {
      this.loading = true
      this.rotate()

      window.addEventListener('resize', this.onResize, false)
    }
  },

  mounted() {
    this.onResize()
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize, false)
  },

  methods: {
    onLoad () {
      this.loading = false

      let stl = this.$refs.stl
      window.stl = stl
      // // let object = stl.object

      this.wrapper = stl.wrapper
      // this.body = stl.object

      // window.lol = stl
      // // window.Matrix4 = Matrix4


      let size = getSize(stl.object)
      let sizeLength = size.length()
      let center = getCenter(stl.object).negate()

      let dist = sizeLength * 2
      this.cameraPosition = {x: 0, y: -dist, z: dist}
      this.cameraLookAt = {x: 0, y: 0, z: size.z}
      stl.camera.position.set(0, -dist, dist)

      // setTimeout(() => stl.update(), 0)
      // console.log({size: size})

      stl.object.position.set(center.x, center.y, center.z + size.z / 2)
      stl.wrapper.position.set(0, 0, 0)

      new GridHelper( 100, 20)

      let dgrid = new GridHelper( 250, 10, 0x0000ff, 0x808080  )
      dgrid.rotation.set(Math.PI / 2, 0, 0)
      stl.wrapper.add(dgrid)
      // console.log(center, center.negate(), object.position)
      // object.position.set(center.x, center.y, center.z)

    },
    rotate () {
      if (!this.autoRotate) return;
      
      if (this.wrapper) {
        this.wrapper.rotation.z += 0.01;
      }
      requestAnimationFrame( this.rotate );
    },

    startAutoRotate() {
      if (this.autoRotate) return;

      this.autoRotate = true

      this.rotate()
    },

    stopRotating () {
      this.autoRotate = false
      this.rotate()
    },

    print() {
      axios.get('tasks/print/' + this.object.name, {params: this.payload}).then(() => {
        this.printing = true  
      })

      this.$emit('finish')
      
    },

    resetPrint() {
      // this.confirming = false
      // this.printing = false
      this.$emit('clean')
    },

    onResize() {
      let stlHolder = this.$refs.stlHolder
      this.$nextTick( () => {
        this.stlSize = {
          width: stlHolder.offsetWidth,
          height: stlHolder.offsetHeight
        }
      })
    },
  },
}

</script>

<style scoped>
.info-panel {
  height: 100px;
  width: 100%;
  background: #000000CC;
}

.stl-holder {
  position: relative;
}

.stl-model {
  position: absolute;
  top: 0;
  left: 0;
}
</style>