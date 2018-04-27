<template>
    <div class="sidebar">
      <div class="header">
        <span class="text">FILA DE IMPRESSÃO</span>
      </div>
        <Card
            class="ma-3 elevate-2"
            v-for="task in tasks"
            :task="task"
            :key="task.id"
        ></Card>
    </div>
</template>

<script>
const getTest = 'http://192.168.0.29:9077/tasks'

import Card from '../components/Card'
import axios from 'axios';


export default {
  name: 'Sidebar',
   components: {
    Card
  },
  data () {
    return {
      tasks:null
    }
  },
  created() {
    this.fetchTasks()
    this.$setInterval(this.fetchTasks, 10)
  },
  methods: {
    fetchTasks: function () {
      
      axios.get(getTest).then((response) => {
        console.log(response.data)
        this.tasks = response.data
      })
      .catch(function (error) {
        console.log(error)
      });

    }
  }
}

</script>

<style scoped>
.header {
  padding: 14px;
  height: 48px;
  background-color: #7a49ff;
}

.text {
  font-family: Ubuntu;
  font-size: 16px;
  font-weight: normal;
  font-style: normal;
  font-stretch: normal;
  line-height: normal;
  letter-spacing: normal;
  text-align: left;
  color: #ffffff;
}

.sidebar {
  height: 100%;
  background-color: #fafafa;
  box-shadow: 2px 0 12px 0 rgba(0, 0, 0, 0.21);
  
}

</style>