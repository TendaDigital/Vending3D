<template>
    <div class="queue-card">
        <span>{{task.status}}</span>
        <span>{{task.payload.description}}</span>
        <v-chip color="red" text-color="black" small>{{task.message}}</v-chip>
        <v-icon>home</v-icon>
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
  width: 292px;
  min-height: 64px;
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0 1px 5px -2px rgba(0, 0, 0, 0.5);
  margin-top: 6px;
  margin-left: 4px;
  margin-right: 4px;
}
</style>