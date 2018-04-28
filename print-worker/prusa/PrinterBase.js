const _ = require('lodash')
const fsReadFile = require('util').promisify(require('fs').readFile)

const sleep = ms => new Promise(res => setTimeout(res, ms))

module.exports = class Printer {
  constructor (options) {
    this.options = options
    
    this.switch = {
      x: false,
      y: false,
      z: false,
      b: false,
    }

    this.state = {
      temp_bed: null,
      temp_bed_target: null,
      temp_extruder: null,
      temp_extruder_target: null,
    }

    this.message = ''
  }

  parse(data) {}

  get name () {
    return this.options.name
  }

  // Resolves promise once connected
  ready() {}

  connect() {}

  async sendCommand(command) {}

  async command(gcode) {
    let original = gcode
    gcode = gcode.replace(/\s*;.*/g, '').trim()

    if (gcode.length <= 1) {
      if (this.options.debug)
        console.log('!', 'skip command:', original)
      return
    }

    this.gcode = gcode

    // Special Soft cases
    if (gcode.startsWith('SOFT:')){
      let cmd = gcode.replace('SOFT:', '')
      if (this.options.debug) {
        console.log('> SOFT', cmd)
      }
      return await this[cmd]()
    } else if (gcode.startsWith('M117')) {
      this.message = gcode.replace('M117 ', '')
    } else if (gcode.startsWith('M104')) {
      this.state.temp_extruder_target = parseFloat(gcode.replace('M104 S', ''))
    } else if (gcode.startsWith('M140')) {
      this.state.temp_bed_target = parseFloat(gcode.replace('M140 S', ''))
    }

    return await this.sendCommand(gcode)
  }

  async commands(gcodes) {
    for (let gcode of gcodes) {
      await this.command(gcode)
    }
  }

  async executeFile(path) {
    let file = await fsReadFile(path)
    let commands = file.toString().split('\n')
    await this.commands(commands)
  }

  async display(string) {
    await this.command(`M117 ${string}`)
  }

  async beep(time = 50) {
    await this.command(`M300 S2000 P${time}`)
  }

  async homeAll() { 
    await this.homeW()
    await this.meshBedLevel()
  }
  async home(axes){
    axes = _.intersection(axes, ['X', 'Y', 'Z', 'W'])
    let cmd = 'G28 ' + axes.join(' ')
    await this.command(cmd)
  }

  async homeX(){ await this.home(['X']) }
  async homeY(){ await this.home(['Y']) }
  async homeZ(){ await this.home(['Z']) }
  async homeW(){ await this.home(['W']) }
  
  async waitForButtonPress(msg = '    Press Button    '){
    this.display(msg)
    
    let t = 1

    do {
      await this.readSwitches()
      await sleep(50)

      if (t++ % 30 == 0) await this.beep(20);
    } while(!this.switch.b)

    await this.beep()
  }
  
  async softwareHome(axis) {
    let homed = false
    let limit = 2000
    
    let AXIS = axis.toUpperCase()
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

    while(limit--) {
      await this.readSwitches()
      if (this.switch[axis]) {
        homed = true
        break
      }
      this.command(`G92 ${AXIS}0.5 F3000`)
      this.command(`G1 ${AXIS}0`)
    }


    let offset = {X: -0.1, Y: -3, Z: 0}
    this.command(`G92 ${AXIS}${offset[AXIS]}`)
    this.command(`G1 ${AXIS}0`)
    this.command(`M300 S2000 P200`)
    if (homed) {
      console.log("Home Ok")
    } else {
      throw new Error("Homing failed on:", AXIS)
    }

  }

  async shutdown(){
    await this.command('G1 Z30 F3000.0')
    await this.command('M84')
    await this.command('M104 S0')
    await this.command('M140 S0')
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

  async meshBedLevel(){ 
    await this.command('G80')
  }

  async readTemperature() {
    return await this.command('M105')
  }
}