import { readFileSync } from 'fs'
import _ from 'lodash'
import Sleep from '../../Util/Sleep'
import { PrinterConfig } from '../../Types'

export type PrinterOptions = {
  name: string
  debug?: boolean
}

export default class PrinterBase {
  static model: string = 'base'

  options: PrinterOptions
  switch: Record<string, boolean>
  state: Record<string, string | number | null>
  #message: string
  constructor(options: PrinterOptions) {
    this.options = options

    this.switch = {}

    this.state = {}

    this.#message = 'Initializing...'
  }

  get name() {
    return this.options.name
  }

  get message() {
    return this.#message
  }

  parse(data) {
    // Empty
  }

  // Resolves promise once connected
  ready() {
    // Empty
  }

  /**
   * This delegate method must be implemented by the underlying class that extends
   * this class to provide connectivity with a real device
   * @param {String} command
   */
  async sendCommand(command: string) {
    throw new Error('This method must be implemented')
  }

  /**
   * Use this method do update the state of a specific switch.
   * Example: `updateSwitchState('x_min', true)`
   * @param {string} place
   * @param {boolean} triggered
   */
  updateSwitchState(place, triggered) {
    if (this.options.debug) console.log('> switch', place, 'is now', triggered)
    this.switch[place] = triggered
  }

  /**
   * Use this method do update the state of printer temperatures
   * Example: `updateTemperatureStates({bed_temp: 10.9, bed_temp_target: null})`
   * @param {string} place
   * @param {boolean} triggered
   */
  updateTemperatureStates(state) {
    Object.assign(this.state, state)
  }

  #gcode: string
  async command(gcode: string) {
    const original = gcode
    gcode = gcode.replace(/\s*;.*/g, '').trim()

    if (gcode.length <= 1) {
      if (this.options.debug) console.log('!', 'skip command:', original)
      return
    }

    this.#gcode = gcode

    // Special Soft cases
    if (gcode.startsWith('SOFT:')) {
      const cmd = gcode.replace('SOFT:', '')
      if (this.options.debug) {
        console.log('> SOFT', cmd)
      }
      return await this[cmd]()
    } else if (gcode.startsWith('M117')) {
      this.#message = gcode.replace('M117 ', '')
    } else if (gcode.startsWith('M104')) {
      this.updateTemperatureStates({
        temp_extruder_target: parseFloat(gcode.replace('M104 S', '')),
      })
    } else if (gcode.startsWith('M140')) {
      this.updateTemperatureStates({
        temp_bed_target: parseFloat(gcode.replace('M140 S', '')),
      })
    }

    // Check if its a blocked command
    const blockedCommands = ['M106 S0', 'M104 S0', 'M140 S0']
    if (blockedCommands.some((check) => gcode.startsWith(check))) {
      console.log('!', 'blocked command skiped:', gcode)
      return
    }

    return await this.sendCommand(gcode)
  }

  async commands(gcodes: string[]) {
    for (const gcode of gcodes) {
      await this.command(gcode)
    }
  }

  // async executeFile(path) {
  //   let file = readFileSync(path)
  //   let commands = file.toString().split('\n')
  //   await this.commands(commands)
  // }

  async display(string: string) {
    await this.command(`M117 ${string}`)
  }

  async beep(time = 50) {
    await this.command(`M300 S2000 P${time}`)
  }

  async homeAll() {
    await this.homeW()
    await this.meshBedLevel()
  }
  async home(axes) {
    axes = _.intersection(axes, ['X', 'Y', 'Z', 'W'])
    const cmd = 'G28 ' + axes.join(' ')
    await this.command(cmd)
  }

  async homeX() {
    await this.home(['X'])
  }
  async homeY() {
    await this.home(['Y'])
  }
  async homeZ() {
    await this.home(['Z'])
  }
  async homeW() {
    await this.home(['W'])
  }

  async *waitForButtonPress(msg = '    Press Button    ') {
    await this.display(msg)

    let t = 1

    do {
      await this.readSwitches()
      await Sleep(50)

      if (t++ % 30 == 0) await this.beep(20)
      yield
    } while (!this.switch['button'])

    await this.beep()
  }

  async softwareHome(axis) {
    let homed = false
    let limit = 2000

    const AXIS = axis.toUpperCase()
    axis = axis.toLowerCase()

    if (AXIS != 'X' && AXIS != 'Y' && AXIS != 'Z') {
      throw new Error('Invalid softwareHome axis: ' + AXIS)
    }

    await this.command(`G4 P40`)
    await this.readSwitches()
    if (this.switch[axis]) {
      await this.command(`G1 ${AXIS}5`)
      await this.command(`G4 P40`)
      await this.readSwitches()
    }

    while (limit--) {
      await this.readSwitches()
      if (this.switch[axis + '_min']) {
        homed = true
        break
      }
      await this.command(`G92 ${AXIS}0.5 F3000`)
      await this.command(`G1 ${AXIS}0`)
    }

    const offset = { X: -0.1, Y: -3, Z: 0 }
    await this.command(`G92 ${AXIS}${offset[AXIS]}`)
    await this.command(`G1 ${AXIS}0`)
    await this.command(`M300 S2000 P200`)
    if (homed) {
      console.log('Home Ok')
    } else {
      throw new Error('Homing failed on:', AXIS)
    }
  }

  async shutdown() {
    // await this.command('G1 Z30 F3000.0')
    // await this.command('M84')
    await this.command('M104 S200')
    await this.command('M140 S60')
  }

  async softwareHomeY() {
    await this.softwareHome('Y')
  }

  async softwareHomeX() {
    await this.softwareHome('X')
  }

  async softwareHomeZ() {
    await this.softwareHome('Z')
  }

  async readSwitches() {
    await this.command('M119')
  }

  async meshBedLevel() {
    await this.command('G80')
  }

  async readTemperature() {
    return await this.command('M105')
  }
}
