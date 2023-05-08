import PrinterBase from '../PrinterBase.js'

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

export default class PrinterMock extends PrinterBase {
  static model: string = 'mocked'

  constructor(options) {
    super(options)
  }

  // Resolves promise once connected
  ready() {
    return sleep(400)
  }

  // connect() {
  //   return sleep(400)
  // }

  async executeFile() {
    console.log('executeFile')
  }

  async sendCommand(command) {
    await sleep(2)
  }

  async *waitForButtonPress() {
    await sleep(500)
  }

  async readTemperature() {
    await super.readTemperature()

    this.state.temp_bed = Math.round(Math.random() * 200)
    this.state.temp_bed_target = Math.round(Math.random() * 200)
    this.state.temp_extruder = Math.round(Math.random() * 200)
    this.state.temp_extruder_target = Math.round(Math.random() * 200)
  }
}
