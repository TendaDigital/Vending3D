const _ = require('lodash')
const fs = require('fs')
const {promisify} = require('util');

const fsReadFile = promisify(fs.readFile)
// const Bot = require('./Bot')
const MarlinServer = require('./MarlinServer')

const sleep = ms => new Promise(res => setTimeout(res, ms))


module.exports = class Printer {
  constructor (options) {
    this.options = options
    // this.channel = new MarlinServer(options)
    // this.channel.on('data', this.parse.bind(this))
    this.switch = {
      x: false,
      y: false,
      z: false,
      b: false,
    }
    this.message = ''
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
    }
  }

  get name () {
    return this.options.name
  }

  // Resolves promise once connected
  ready() {
    return sleep(400)
  }

  connect() {
    return sleep(400)
  }

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
      await this[cmd]()
      return
    } else if (gcode.startsWith('M117')) {
      this.message = gcode.replace('M117 ', '')
    }

    await sleep(2)
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
    
  }
  
  async softwareHome(axis) {
    
  }

  async checkPrint() {
    await this.readSwitches()
    if (this.switch.b){
      await this.display("Part Found 200 OK")
    }else {
      await this.shutdown()
      await this.command('M300 S2000 P500')
      await this.command('M300 S0 P20')
      await this.command('M300 S2000 P500')
      await this.command('M300 S0 P20')
      await this.command('M300 S2000 P500')
      await this.command('M300 S0 P20')
      throw new Error("Part Not Found 404")
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


}