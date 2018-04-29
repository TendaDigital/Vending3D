<template>
  <div class="printer-card hover-parent py-2 pl-2 pr-3" :class="statusColor">
    <div v-if="printer.task" class="progress-bar" v-bind:style="{ width: printer.task.progress + '%' }"></div>

    <div class="flex row align-center" style="z-index: 1; position: relative;">
      <div class="column">
        <span class="subheading mb-1">{{printer.name}}</span>
        <small :class="statusColorText">{{statusName}}</small>
      </div>
      
      <div class="flex"></div>

      <div v-if="printer.task" class="grey--text" style="font-family: monospace">
        <small>{{printer.task.payload.name}}</small><v-icon size="14">attach_file</v-icon>
      </div>

      <template v-if="printer.status != 'disconnected'">
        <TemperatureTag
          v-if="printer.state.temp_bed"
          class="ml-1"
          tag="Base"
          :value="printer.state.temp_bed"
          :target="printer.state.temp_bed_target"
        ></TemperatureTag>

        <TemperatureTag
          v-if="printer.state.temp_extruder"
          class="ml-1"
          tag="Extrusor"
          :value="printer.state.temp_extruder"
          :target="printer.state.temp_extruder_target"
        ></TemperatureTag>
      </template>

      <v-btn 
        v-if="printer.status == 'disconnected'"
        icon size="small" 
        @click="removePrinter()"
        class="hover-show-translucid ma-0">
        <v-icon>close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>

import axios from 'axios'

import TemperatureTag from './TemperatureTag'

export default {
  name: 'PrinterStatus',
  props: {
    printer: {
      type: Object,
      required: true
    }
  },

  components: {
    TemperatureTag,
  },

  computed: {
    statusColor() {
      return {
        'idle': 'light-green accent-4',
        'printing': 'light-blue',
        'disconnected': 'red',
        'waiting': 'amber',
      }[this.printer.status] || 'grey'
    },

    statusColorText() {
      return {
        'idle': 'light-green--text text--accent-4',
        'printing': 'light-blue--text',
        'disconnected': 'red--text',
        'waiting': 'amber--text text--darken-2',
      }[this.printer.status] || 'grey'
    },

    statusName() {
      return {
        'idle': 'Online',
        'printing': 'Imprimindo' + (this.printer.task ? ' - '+this.printer.task.progress + '%' : ''),
        'disconnected': 'Offline',
        'waiting': 'Aguardando liberação',
      }[this.printer.status] || this.printer.status
    },
  },

  methods: {
    removePrinter() {
      axios.get('printers/' + this.printer.id + '/remove')
    },
  },
}
</script>

<style scoped>

.printer-card {
  position: relative;
  border-radius: 4px;

  border-left-width: 8px;
  border-left-style: solid;
  background: white !important;
}

.progress-bar, .progress-bar-failed {
  position: absolute;
  border-radius: 4px;
  top: 0;
  left: 0;
  height: 100%;
  width: 0%;
  transition: width 0.3s;
}

.progress-bar {
  background-color: #58baff24;
}

@keyframes anim-fade-scale {
    0% {
      opacity: 0;
      transform: scale(1.0);
    }
    
    50% {
      opacity: 1;
    }

    100% {
      opacity: 0;
      transform: scale(1.4);
    }
}

.printer-waiting {
  position: absolute;
  top: 0;
  left: 0;

  animation: 2.0s anim-fade-scale infinite;
}

</style>