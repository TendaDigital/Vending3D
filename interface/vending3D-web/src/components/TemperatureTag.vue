<template>
  <el-tooltip effect="dark" :content="statusTextLong" placement="top">
    <span class="tag" :class="statusClass">{{statusText}}</span>
  </el-tooltip>
</template>

<script>

export default {
  name: 'TemperatureTag',
  props: {
    tag: {
      type: String,
      default: '',
    },

    target: {
      type: Number,
      required: true
    },

    value: {
      type: Number,
      required: true,
    },

    range: {
      type: Number,
      default: 3,
    },
  },

  computed: {
    statusClass() {
      let delta = this.target - this.value

      if (Math.abs(delta) < this.range)
        return 'stable';

      return (delta < 0) ? 'off' : 'on';
    },

    statusText() {
      return (this.tag[0] ? this.tag[0] + ':' : '') + Math.round(this.value)
    },

    statusTextLong() {
      return this.tag + ' ' + this.value + ' / ' + this.target
    },
  },
}
</script>

<style scoped>
.tag {
  min-width: 50px;
  padding: 4px 8px;
  color: white;
  border-radius: 3px;
  font-size: 10px;
  text-align: center;
  font-weight: bold;
  font-family: monospace;
}

.tag.off {
  background: #9B9B9B;
}

.tag.on {
  background: #E44646;
}

.tag.stable {
  background: #7ED321;
}
</style>