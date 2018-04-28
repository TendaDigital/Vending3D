const _ = require('lodash')

const PrinterBase = require('./PrinterBase')
const MarlinServer = require('./MarlinServer')

module.exports = class PrinterPrusa extends PrinterBase {
  constructor (options) {
    super(options)

    this.channel = new MarlinServer(options)
    this.channel.on('data', this.parse.bind(this))
  }

  parse(data) {
    if (data.startsWith('x_min:')) {
      this.switch.x = data.includes('TRIGGERED')
    } else if (data.startsWith('y_min:')) {
      this.switch.y = data.includes('TRIGGERED')
    } else if (data.startsWith('z_min:')) {
      this.switch.z = data.includes('TRIGGERED')
    } else if (data.startsWith('x_max:')){
      this.switch.b = data.includes('TRIGGERED')
    } else if (data.startsWith('T:')) {
      // T:118.73 E:0 B:35.4
      var [
        $, temp_extruder,
        active_extruder,
        $, temp_bed] = data.match(/T:(\d+\.?\d*)\s*E:(\d+\.?\d*)\s*(B:(\d+\.?\d*))?/) || []
      
      if (!_.isUndefined(temp_extruder)) {
        this.state.temp_extruder = parseFloat(temp_extruder)
      }

      if (!_.isUndefined(temp_bed)) {
        this.state.temp_bed = parseFloat(temp_bed)
      }
    }
  }

  // Resolves promise once connected
  ready() {
    return this.channel.ready()
  }

  connect() {
    return this.channel.connect()
  }

  async sendCommand(command) {
    return await this.channel.execute(command)
  }

  async readTemperature() {
    let data = await super.readTemperature()

    var [$, temp_bed, temp_bed_target] = data.match(/B:(\d+\.?\d*)\s*\/(\d+\.?\d*)/) || []
    var [$, temp_extruder, temp_extruder_target] = data.match(/T:(\d+\.?\d*)\s*\/(\d+\.?\d*)/) || []
    
    Object.assign(this.state, {
      temp_bed: parseFloat(temp_bed),
      temp_bed_target: parseFloat(temp_bed_target), 
      temp_extruder: parseFloat(temp_extruder),
      temp_extruder_target: parseFloat(temp_extruder_target),
    })
  }
}