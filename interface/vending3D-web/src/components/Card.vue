<template>
    <div class="queue-card">
      <div  v-if="task.status != 'failed'" class="progress-bar" v-bind:style="{ width: task.progress + '%' }"></div>
      <div  class="ontop row">
        
        <v-chip v-if="task.status == 'queued'" label color="yellow" text-color="white" small><v-icon small>perm_identity</v-icon> <span>{{task.payload.description}}</span></v-chip>
        <v-chip v-else-if="task.status == 'failed'" label color="red" text-color="white" small><v-icon small>perm_identity</v-icon> <span>{{task.payload.description}}</span></v-chip>
        <v-chip v-else label color="teal" text-color="white" small><v-icon small>perm_identity</v-icon> <span>{{task.payload.description}}</span></v-chip>
        
        
        <div class="flex"></div>
        <div v-if="task.status != 'queued'">
          <v-chip label outline color="blue" small>{{task.owner}}</v-chip>
        </div>
      </div>
      <div class="ontop row ma-2">
        <div v-if="task.status != 'queued'" class="printing-message">
          <span>{{task.message}}</span> - <span class="progress">{{task.progress}}</span>%
        </div>
        <div v-else>
          <span class="queued-message">Aguardando Impressora...</span> 
        </div>
        <div class="flex"></div>
        <div class="payload-name">{{task.payload.name}}.gcode <v-icon small>attach_file</v-icon></div>
      </div>  
    </div>
</template>

<script>
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

.teal{
  background-color: #7ed321!important;
  border-color: #7ed321!important;

}

.yellow{
  background-color: #f5a623!important;
  border-color: #f5a623!important;
}

.red{
  background-color: #d0021b!important;
  border-color: #d0021b!important;
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
  background-color: #E4FED9;
}

.progress-bar-failed{
  background-color: #d0021b;

}

.printing-message {
  color: #7ed321;
}

.queued-message {
  color: #f5a623;
}

.ontop {
  position: relative;
  z-index: 2;
}

.status, .payload-name {
  font-size: 13px;
}

</style>