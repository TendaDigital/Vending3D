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
})

// Model.pre('save', () => {
//   this.running = ['queued', 'running'].includes(thhis.status)
// })

module.exports = require('mongoose').model('Task', Model);