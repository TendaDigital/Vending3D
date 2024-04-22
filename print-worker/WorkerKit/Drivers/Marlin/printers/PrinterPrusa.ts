import _ from 'lodash'

import PrinterBase from '../PrinterBase.js'
import MarlinServer from '../MarlinServer.js'
import { EventEmitter } from 'stream'

export default class PrinterPrusa extends PrinterBase {
  static model = 'prusa'

  channel: MarlinServer
  constructor(options) {
    super(options)

    this.channel = new MarlinServer(options, {
      START_COMMAND: null,
      START_TOKEN: 'start',
    })

    this.channel.on('state:switch', ({ place, triggered }) => {
      // console.log('switch updated: ', {place, triggered})
      this.updateSwitchState(place, triggered)
      // Update button switch to detect keypresses
      if (place == 'x_min') this.updateSwitchState('button', triggered)
    })
    this.channel.on('state:temperature', (state) => {
      this.updateTemperatureStates(state)
    })

    this.channel.on('data', this.parse.bind(this))
  }

  parse(data) {
    // if (data.startsWith('x_min:')) {
    //   this.switch.x = data.includes('TRIGGERED')
    // } else if (data.startsWith('y_min:')) {
    //   this.switch.y = data.includes('TRIGGERED')
    // } else if (data.startsWith('z_min:')) {
    //   this.switch.z = data.includes('TRIGGERED')
    // } else if (data.startsWith('x_max:')){
    //   this.switch.b = data.includes('TRIGGERED')
    // } else
    if (data.startsWith('T:')) {
      // T:118.73 E:0 B:35.4
      const [, temp_extruder, active_extruder, , temp_bed] =
        data.match(/T:(\d+\.?\d*)\s*E:(\d+\.?\d*)\s*(B:(\d+\.?\d*))?/) || []

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

  // connect() {
  //   return this.channel.connect()
  // }

  async sendCommand(command) {
    await this.channel.execute(command)
  }
}
