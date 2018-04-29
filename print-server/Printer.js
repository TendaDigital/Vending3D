/*
 * Database Model
 */
const Schema = require('mongoose').Schema

var Model = new Schema({
  name: String,

  connected: {
    type: Boolean,
    default: false,
  },

  pingAt: {
    type: Date,
    default: Date.now,
  },

  message: {
    type: String,
    default: ''
  },

  state: {
    type: Object,
    default: {},
  }
})

Model.virtual('active').get(function () {
  return this.connected && (Date.now() - this.pingAt < 5000)
})

Model.virtual('status').get(function () {
  return this.active ? this.message : 'disconnected'
})

Model.virtual('task', {
  ref: 'Task',
  localField: 'name',
  foreignField: 'owner',
  justOne: true,
  default: null,
})

Model.method('ping', function (message = undefined) {
  this.pingAt = new Date()
  this.connected = true

  if (message) {
    this.message = message
  }
})

Model.static('ping', async function (name, message = undefined) {
  let printer = await this.findOrCreate(name)
  printer.ping()
  await printer.save()
})

Model.static('disconnected', async function (name) {
  let printer = await this.findOrCreate(name)
  printer.connected = false
  await printer.save()
})

Model.static('findOrCreate', async function (name) {
  let printer = await this.findOne({name})

  if (!printer) {
    return await this.create({name})
  }

  return printer
})

// Model.pre('save', () => {
//   this.running = ['queued', 'running'].includes(thhis.status)
// })
const PluginTimestamp = require('mongoose-timestamp')
Model.plugin(PluginTimestamp)

module.exports = require('mongoose').model('Printer', Model);