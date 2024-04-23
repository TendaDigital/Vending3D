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

  private detatched = false
  async *waitForButtonPress(msg?: string) {
    yield
    await this.ready()
    if (!this.detatched) {
      console.log('detaching...')
      await this.sendCommand('JS110')
      await this.sendCommand('JD')
      this.detatched = true
    }
  }

  // Resolves promise once connected
  ready() {
    return this.channel.ready()
  }

  async sendCommand(command: string) {
    this.detatched = false
    await this.channel.execute(command)
  }
}
