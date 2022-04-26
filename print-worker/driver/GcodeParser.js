const fs = require('fs')
const path = require('path')
const format = require('string-template')

module.exports = class GcodeParser {

  constructor(file, options) {
    this.options = options || {}
    this.path = file
    this.load()
  }

  load() {
    let filePath = this.path
    this.name = path.basename(filePath, '.gcode')

    let file = fs.readFileSync(filePath)
    this.commands = file.toString().split('\n')
    this.cursor = 0
  }

  percentage() {
    return Math.floor(100 * ((this.cursor - 1) / this.commands.length))
  }

  next() {
    let command = this.commands[this.cursor++]

    if (command == null) {
      return null
    }

    // Apply template to it
    let params = this.options.params || {}
    command = format(command, params)

    return command
  }
}