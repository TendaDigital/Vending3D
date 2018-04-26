/*
 * Database Model
 */
const Schema = require('mongoose').Schema

var Model = new Schema({
  namespace: String,

  active: {
    type: Boolean,
    default: true,
  },

  status: {
    type: String,
    default: 'queued',
    required: true,
  },
  
  owner: {
    type: String,
  },

  queuedAt: {
    type: Date,
    default: Date.now,
  },

  lockedAt: {
    type: Date,
    default: null,
  },

  pingAt: {
    type: Date,
    default: null,
  },

  progress: Number,
  message: String,

  payload: Object,

  restarts: {
    type: Number,
    default: 1,
  },
})

Model.pre('save', function () {
  if (this.isModified('status') && this.status == 'queued') {
    this.queuedAt = Date.now()
  }
})

Model.method('reset', function () {
  this.set({
    active: true,
    status: 'queued',
    owner: null,
    pingAt: null,
    lockedAt: null,
    progress: null,
    message: 0,
    restarts: (this.restarts + 1) || 2
  })
})

// Model.pre('save', () => {
//   this.running = ['queued', 'running'].includes(thhis.status)
// })

const PluginTimestamp = require('mongoose-timestamp')
Model.plugin(PluginTimestamp)


module.exports = require('mongoose').model('Task', Model);