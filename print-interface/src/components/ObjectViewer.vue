<template>
  <div class="column align-center justify-center" style="position: relative;">
    <!-- <div class="info-panel row justify-between align-center px-4" style="height: 100px;">
      <div class="display-3 align-center row">
        <img src="../../static/layers-icon-colorido.svg" alt="Ícone da Layers" style="width: 48px; height: 48px">
      </div>
    </div> -->
    <!-- <div class="object-name">
        <span class="grey--text">Modelo de {{objectName}}</span>
    </div> -->
    <div style="position: absolute; top: 2%; right: 5%; z-index: 100">
      <el-button @click="openWaitList" class="ml-0" style="justify-self: flex-end">Fila de Espera</el-button>
      <el-button :type="this.stage == 'initial' ? 'success' : 'primary' " size="large" @click="$emit('confirm')" style="justify-self: center; width: 100px">{{buttonText}}</el-button>
      <!-- <el-button v-else-if="stage=='print'" type="primary" size="large" @click="print()">Clique para confirmar</el-button> -->
      <!-- <span v-else class="light-green--text" @click="resetPrint()"><v-icon v-if="stage != 'initial'" v-icon>check</v-icon> enviado para fila de impressão</span> -->
    </div>
    <el-drawer :visible.sync="isWaitlistOpen" :with-header="false" size="90%">
      <Sidebar />
    </el-drawer>
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

import { GridHelper } from 'three'
import axios from 'axios'

import {ModelStl} from 'vue-3d-model'

import {getSize, getCenter} from '../helpers/Util3D'

import Sidebar from './Sidebar.vue'

export default {
  name: 'ObjectViewer',

  components: {
    ModelStl,
    Sidebar
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
    },
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
      printId: null,
      isWaitlistOpen: false
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

    buttonText() {
      return this.stage == 'initial' ? 'Imprimir' : 'Enviado'
    }
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

  destroyed() {
    console.log('unmounted')
    this.autoRotate = false
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
      axios.get('tasks/print/' + this.object.name + '?description='+ this.payload.name).then((response) => {
        this.printId = response.data.id
        this.postForm()
        this.printing = true

      }).catch(function (e) {
        console.error(e)
      });

      this.$emit('finish')

    },

    postForm: function () {
        axios.get('https://script.google.com/a/tenda.digital/macros/s/AKfycbyCGfd66lclHCduZEbOtrYupG6KGI37JhbtOxlADrO7zSbvoYlZ/exec?isWrite=true', {
            params: {
             name: this.payload.name,
             email: this.payload.email,
             number: this.payload.phone,
             role: this.payload.role,
             school: this.payload.school,
             studentsNumber: this.payload.studentsNumber,
             printid: this.printId,
             action: 'insert',
             phone: `55${this.payload.phone}`,
             _id: this.printId
            }
        }).then((response) => {
          console.log("print insert" +  response)
        })
        .catch(function (e) {
            console.error(e)
        });
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

    openWaitList() {
      this.isWaitlistOpen = true
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

.object-name {
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  max-height: 60px;
  width: 100%;
  height: 100%;
  padding: min(30px, 2.5%) 0;
  background-color: #590653;
  font-size: 24px;
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
