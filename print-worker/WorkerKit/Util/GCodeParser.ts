import format from 'string-template'

export default class GcodeParser {
  #content: string
  #template: object

  #cursor: number
  #commands: string[]

  constructor(content, template) {
    this.#template = template || {}
    // this.path = file
    this.#content = content
    this.#load()
  }

  #load() {
    // let filePath = this.path;
    // this.name = path.basename(filePath, ".gcode");

    // let file = fs.readFileSync(filePath);
    this.#commands = this.#content.toString().split('\n')
    this.#cursor = 0
  }

  percentage() {
    return Math.floor(100 * ((this.#cursor - 1) / this.#commands.length))
  }

  // next() {
  //   let command = this.#commands[this.#cursor++]

  //   if (command == null) {
  //     return null
  //   }

  //   // Apply template to it
  //   command = format(command, this.#template)

  //   return command
  // }

  [Symbol.iterator]() {
    return {
      next: () => {
        let command = this.#commands[this.#cursor++]

        if (command == null) {
          return { done: true }
        }

        // Apply template to it
        command = format(command, this.#template)

        return { value: command, done: false }
      },
    }
  }
}
