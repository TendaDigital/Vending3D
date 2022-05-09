const MarlinServer = require("../MarlinServer")
const PrinterPrusa = require("./PrinterPrusa")

module.exports = class PrinterEnder extends PrinterPrusa {
  static match({port}) {
    const vendorId = port.vendorId || ''
    return vendorId == "1a86"
  }

  constructor (options) {
    super(options)

    this.channel = new MarlinServer(options, {
      START_COMMAND: null,
      START_TOKEN: null
    })

    this.channel.on('state:switch', ({place, triggered}) => {
      // console.log('switch updated: ', {place, triggered})
      this.updateSwitchState(place, triggered)
      // Update button switch to detect keypresses
      if (place == 'x_min')
        this.updateSwitchState('button', triggered)
    })

    this.channel.on('state:temperature', (state) => {
      this.updateTemperatureStates(state)
    })

    // this.channel.on('data', this.parse.bind(this))
  }
}
