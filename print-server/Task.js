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

  startedAt: {
    type: Date,
    default: null,
  },

  completedAt: {
    type: Date,
    default: null,
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
  if (this.isModified('status')) {
    if (this.status == 'queued') {
      this.queuedAt = Date.now()
    } else if (this.status == 'running') {
      this.startedAt = Date.now()
    } else if (this.status == 'failed') {
      this.completedAt = Date.now()
    } else if (this.status == 'success') {
      this.completedAt = Date.now()
    } else if (this.status == 'canceled') {
      this.completedAt = Date.now()
    }
  } 
})

Model.virtual('duration').get(function () {
  if (this.status != 'success')
    return null;
  
  return this.startedAt && this.completedAt ? this.completedAt - this.startedAt : null
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