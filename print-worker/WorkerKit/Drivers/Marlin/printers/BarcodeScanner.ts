import MarlinServer from '../MarlinServer.js'
import PrinterPrusa from './PrinterPrusa.js'

export default class BarcodeScanner extends PrinterPrusa {
  static model = 'barcode'

  constructor(options) {
    super(options)

    this.channel = new MarlinServer(options, {
      START_COMMAND: null,
      START_TOKEN: null,
      debug: true,
    })
  }

  async *waitForButtonPress(msg?: string) {
    yield
    // Void
    await this.ready()
  }

  // Resolves promise once connected
  ready() {
    return this.channel.ready()
  }

  async sendCommand(command: string) {
    await this.channel.execute(command)
  }
}
