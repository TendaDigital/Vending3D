<template>
    <div v-if="this.status != 'errorHandled'" class="queue-card pa-3" @click="$emit('click')">
      
      <!--Progress Bar-->
      <div  v-if="task.status == 'running'" class="progress-bar" v-bind:style="{ width: task.progress + '%' }"></div>

      <!--First row, contains user name (task.payload.description) and printer id (task.owner)-->
      <div  class="ontop row">
        <!--User name (task.payload.description)-->
        <v-chip label color="grey" text-color="grey darken-2" outline small class="ma-0">
          <v-icon small>perm_identity</v-icon> <span>{{task.payload.description}}</span>
          <span class="ml-1">- {{task.payload.name}}.gcode</span>
        </v-chip>
        
        <!-- <v-chip v-else-if="task.status == 'failed'" label color="red" text-color="white" small><v-icon small>perm_identity</v-icon> <span>{{task.payload.description}}</span></v-chip>
        <v-chip v-else-if="task.status == 'running'" label color="light-blue" text-color="white" small><v-icon small>perm_identity</v-icon> <span>{{task.payload.description}}</span></v-chip>
        <v-chip v-else-if="task.status == 'success'" label color="teal" text-color="white" small><v-icon small>perm_identity</v-icon> <span>{{task.payload.description}}</span></v-chip>
         -->
        <!--Fill space-->
        <div class="flex"></div>
        <!--Printer id (task.owner)-->
       
        <v-chip label :color="statusColor" text-color="white" small class="ma-0">
          <span v-if="task.status !='queued'">{{task.owner}}</span>
          <span v-else class="mr-2"> 
            <span>Aguardando</span>
            <!-- <v-progress-circular indeterminate :color="statusColor" :size="16" :width="2"></v-progress-circular> -->
          </span>
        </v-chip>
        
       
      </div>
      <!--Second row, contains task status (task.message), task progress in percentage (task.progress) and payload name/gcode file (task.payload.name)-->
      <div class="ontop row align-center pt-2">
        <!--Task status-->
        <div v-if="task.status != 'queued'" class="flex grey--text text--darken-2">
          <span>{{task.message}}</span>
          <span v-if="task.status == 'running'">- {{task.progress}}%</span>
        </div>

        <!-- Waiting bar -->
        <v-progress-linear v-else :indeterminate="true" height="3" color="amber darken-2" class="flex mr-3"></v-progress-linear> 
          
        <!-- <div v-if="task.status != 'failed'" class="grey--text payload-name">
         
        </div> -->

        <!--Payload name/gcode file (task.payload.name)-->
        <div><el-button v-on:click="rePostTask()" size="mini">Re-enviar</el-button></div>
        <!-- <div v-else-if="task.status == 'failed'" class="error-message">
          <span>{{task.message}}</span>
        </div>
        <div v-else-if="task.status == 'success'" class="success-message">
          <span>{{task.message}}</span>
        </div>
        <div v-else>
          <span>{{task.message}}</span> - <span class="progress">{{task.progress}}</span>%
        </div> -->
        
        
      </div>

    </div>
</template>

<script>
const postTask = 'http://192.168.0.29:9077/tasks/'

import axios from 'axios'

export default {
  name: 'Card',
  props: {
      task: {
        type: Object,
        required: true
      }
  },
  data () {
    return {
      status: null
    }
  },

  computed: {
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
  },

  methods: {
    rePostTask: function () {
      
      axios.get(postTask + this.task.id + '/repeat').then((response) => {
        console.log(response.data)
        //this.status = 'errorHandled'
         //this.tasks = response.data
       })
       .catch(function (error) {
         console.log(error)
      });
      console.log('repost')

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