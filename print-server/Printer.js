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
  }
})

Model.virtual('active').get(function () {
  return Date.now() - this.pingAt < 5000
})

Model.virtual('status').get(function () {
  return this.active && this.connected ? 'connected' : 'disconnected'
})

Model.static('ping', async function (name, connected = true) {
  let printer = await this.findOrCreate(name)
  printer.pingAt = new Date()
  printer.connected = connected
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