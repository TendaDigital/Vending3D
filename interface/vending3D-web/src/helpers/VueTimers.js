export default {
  beforeDestroy: function () {
    this.$intervals && this.$intervals.map(t => clearInterval(t))
    this.$intervals = undefined

    this.$timeouts && this.$timeouts.map(t => clearTimeout(t))
    this.$timeouts = undefined
  },

  methods: {
    $setInterval: function (fn, time) {
      this.$intervals = this.$intervals || []
      this.$intervals.push(setInterval(fn, time))
    },

    $setTimeout: function (fn, time) {
      this.$timeouts = this.$timeouts || []
      this.$timeouts.push(setTimeout(fn, time))
    },
  }
}