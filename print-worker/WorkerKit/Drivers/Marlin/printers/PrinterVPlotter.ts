import { PrinterConfig } from '../../../Types.js'
import Sleep from '../../../Util/Sleep.js'
import MarlinServer from '../MarlinServer.js'
import PrinterBase from '../PrinterBase.js'

export default class PrinterVPlotter extends PrinterBase {
  static match(config: PrinterConfig) {
    return config.marlin?.model == 'vplotter'
    // const vendorId = serialport.vendorId || ''
    // return vendorId == '27b1'
  }

  channel: MarlinServer
  constructor(options: PrinterConfig) {
    super(options)

    this.channel = new MarlinServer(options, {
      START_COMMAND: true,
      START_TOKEN: 'start',
      baudRate: 250000,
    })

    this.channel.on('state:switch', ({ place, triggered }) => {
      // console.log('switch updated: ', {place, triggered})
      this.updateSwitchState(place, triggered)
      // Update button switch to detect keypresses
      if (place == 'x_max') this.updateSwitchState('button', triggered)
    })
  }

  async *waitForButtonPress() {
    await Sleep(1000)
  }

  // Resolves promise once connected
  ready() {
    return this.channel.ready()
  }

  async sendCommand(command: string) {
    await this.channel.execute(command)
  }
}
