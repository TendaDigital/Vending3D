<template>
    <div
      v-if="this.status != 'errorHandled'"
      class="queue-card pa-3"
      :style="{'background-image': 'url(\'' + fileThumb + '\')'}"
      @click="$emit('click')">
      <!--Task status watcher-->
      <template>{{taskStatus}}</template>
      <!--Progress Bar-->
      <div v-if="task.status == 'running'" class="progress-bar" :style="{ width: task.progress + '%' }"></div>
      <!--First row, contains user name (task.payload.description) and printer id (task.owner)-->
      <div class="ontop row">
        <!-- Current status -->
        <v-chip label :color="statusColor" text-color="white" small class="ma-0">
          <template v-if="task.status !='queued'">{{task.owner}}</template>
          <template v-else>Aguardando</template>
        </v-chip>

        <!--Fill space-->
        <div class="flex"></div>
        <!--Printer id (task.owner)-->

        <!--User name (task.payload.description)-->
        <v-chip label color="grey" text-color="grey darken-2" outline small class="ma-0">
          <template v-if="task.payload && task.payload.description">
            <v-icon small>perm_identity</v-icon>
            <span class="mr-3">{{task.payload.description}}</span>
          </template>
          <v-icon size="12">attach_file</v-icon>
          <span> {{task.file}}</span>
        </v-chip>
      </div>

      <!--Second row, contains task status (task.message), task progress in percentage (task.progress) and payload name/gcode file (task.payload.name)-->
      <div class="ontop row align-center pt-2">
        <!--Task status-->
        <div v-if="task.status != 'queued'" class="flex grey--text text--darken-2 ellipsis">
          <span>{{task.message}}</span>
          <span v-if="task.status == 'running'">- {{task.progress}}%</span>
        </div>

        <!-- Waiting bar -->
        <v-progress-linear v-else :indeterminate="true" height="3" color="amber darken-2" class="flex mr-3"></v-progress-linear>

        <!--Payload name/gcode file (task.payload.name)-->
        <el-button v-if="task.status == 'failed' || task.status == 'canceled'"
          @click="retryTask()" type="warning" icon="el-icon-refresh" plain size="mini" class="px-2"></el-button>
        <el-button v-else-if="task.status == 'running' || task.status == 'queued'"
          @click="cancelTask()" type="danger" icon="el-icon-close" plain size="mini" class="px-2"></el-button>

        <el-button v-if="task.status == 'success' || task.status == 'failed' || task.status == 'canceled'"
          @click="archiveTask()" type="primary" icon="el-icon-check" plain size="mini" class="px-2"></el-button>

      </div>

    </div>
</template>

<script>

import axios from 'axios'

export default {
  name: 'TaskStatus',
  props: {
      task: {
        type: Object,
        required: true
      }
  },
  data () {
    return {
      status: null,
      printStatusSent: false,
    }
  },

  computed: {
    taskStatus() {
      if(this.task.status == 'success' && this.printStatusSent == false){
        this.sendPrintStatus()
        this.printStatusSent = true
        //console.log(this.task.id)
      }
      //return this.task.status
    },

    statusColor() {
      return {
        'running': 'light-blue',
        'failed': 'red',
        'canceled': 'red',
        'queued': 'amber',
        'success': 'light-green accent-4',
      }[this.task.status] || 'grey'
    },

    statusColorText() {
      return {
        'running': 'light-blue--text',
        'failed': 'red--text',
        'canceled': 'red--text',
        'queued': 'amber--text text--darken-2',
        'success': 'light-green--text text--darken-2',
      }[this.task.status] || 'grey--text'
    },

    fileThumb() {
      if (!this.task) return;

      return SERVER_URL + '/objects/files/' + this.task.file.replace(/.*\//, '').replace(/\..*/, '') + '.png'
    },
  },

  methods: {
    retryTask: function () {
      axios.get('tasks/' + this.task.id + '/repeat')
    },

    cancelTask: function () {
      axios.get('tasks/' + this.task.id + '/cancel')
    },

    archiveTask: function () {
      axios.get('tasks/' + this.task.id + '/archive')
    },

    sendPrintStatus: function () {
      // axios.get('https://script.google.com/a/tenda.digital/macros/s/AKfycbyCGfd66lclHCduZEbOtrYupG6KGI37JhbtOxlADrO7zSbvoYlZ/exec?isUpdate=true', {
      //       params: {
      //        status: 'queued',
      //        _id: this.task.id,
      //        name: this.task.payload.description
      //       }
      //   }).then((response) => {
      //     console.log('print finished' + response)
      //   })
      //   .catch(function (e) {
      //       console.error(e)
      //   });
    }
  }
}
</script>

<style scoped>

/* Root css of card */
.queue-card {
  position: relative;
  min-height: 76px;
  border-radius: 4px;
  background-color: #fafafa;
  /* background-size: 10px 10px; */

  background-color: #FFF;
  background-size: contain;
  background-position: center center;
}

.error-message{
  color: #d0021b;
}

.success-message {
  color: #7ed321;
}

.queued-message {
  color: #f5a623;
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

.ontop {
  position: relative;
  z-index: 2;
}

.status, .payload-name {
  font-size: 13px;
}

</style>
