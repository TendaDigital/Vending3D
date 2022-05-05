<template>
  <div class="sidebar column">
    <div class="header no-flex">
      <span class="text">Fila De Impressão</span>
    </div>

    <div class="flex column scroll-y" style="background: #F0F0F0;">
      <transition-group
        tag="div"
        class="column flex"
        style="position: relative; min-height: 100%; display: block;"
        mode="out-in"
        name="trans-lr"
      >
        <div class="trans-lr px-3 pt-2 " v-for="task in tasks" :key="task.id">
          <TaskStatus
            class="elevate-2"
            :task="task"
            @click="selectedTask = task"
          ></TaskStatus>
        </div>

        <div
          v-if="tasks && !tasks.length"
          class="flex trans-lr column align-center pa-5 white"
          key="dino"
        >
          <div class="flex"></div>
          <img src="/static/dino.svg" style="width: 100%;" />
          <span class="mt-3 grey--text">Nenhuma impressão na fila</span>
          <div class="flex"></div>
        </div>
      </transition-group>
    </div>
    <el-button @click="cleanTasks">Limpar fila</el-button>
    <div class="column px-2 grey darken-3 no-flex" v-if="printers">
      <transition-group name="trans-lr">
        <PrinterStatus
          v-for="printer in printers"
          class="my-2 trans-lr"
          :key="printer.name"
          :printer="printer"
        ></PrinterStatus>
      </transition-group>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import TaskStatus from "./TaskStatus";
import PrinterStatus from "./PrinterStatus";

export default {
  name: "Sidebar",

  components: {
    TaskStatus,
    PrinterStatus
  },

  data() {
    return {
      tasks: null,
      printers: null,
      selectedTask: null,

      loadingTasks: false,
      loadingPrinters: false
    };
  },
  created() {
    this.fetchTasks();
    this.fetchPrinters();
    this.$setInterval(this.fetchTasks, 500);
    this.$setInterval(this.fetchPrinters, 500);
  },
  methods: {
    fetchTasks: function() {
      if (this.loadingTasks) return;
      this.loadingTasks = true;

      axios
        .get("tasks")
        .then(response => {
          this.loadingTasks = false;
          this.tasks = response.data;
        })
        .catch(function(e) {
          this.loadingTasks = false;
          console.error(e);
        });
    },

    fetchPrinters() {
      if (this.loadingPrinters) return;

      this.loadingPrinters = true;
      axios
        .get("printers")
        .then(res => {
          this.loadingPrinters = false;
          this.printers = res.data;
        })
        .catch(function(e) {
          this.loadingPrinters = false;
          console.error(e);
        });
    },

    cleanTasks() {
      this.tasks = this.tasks.filter(async task => {
        if (task.status !== "running")
          await axios.get(
            "http://localhost:9077/tasks/" + task.id + "/archive"
          );
        return task.status !== "success" && task.status !== "failed";
      });
    }
  }
};
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
  display: flex;
  height: 100%;
  background-color: #fafafa;
  box-shadow: 2px 0 12px 0 rgba(0, 0, 0, 0.21);
}

.trans-lr {
  transition: all 0.3s;
  /* display: block; */
  width: 100%;
}
/* .trans-lr-enter-active, .trans-lr-leave-active {
  position: absolute;
} */

.trans-lr-enter {
  opacity: 0;
  transform: translateX(-50px);
}

.trans-lr-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

.trans-lr-enter-active {
  /* position: absolute !important; */
}

.trans-lr-leave-active {
  position: absolute !important;
  width: 100%;
  /* z-index: 3; */
}

/* .trans-lr-enter {
  opacity: 0;
  transform: translateX(-100%);
}

.trans-lr-leave-to {
  opacity: 0;
  transform: translateX(100%);
} */
</style>
