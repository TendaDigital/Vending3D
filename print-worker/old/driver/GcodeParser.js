import format from "string-template";

export default class GcodeParser {
  constructor(content, options) {
    this.options = options || {};
    // this.path = file
    this.content = content;
    this.load();
  }

  load() {
    // let filePath = this.path;
    // this.name = path.basename(filePath, ".gcode");

    // let file = fs.readFileSync(filePath);
    this.commands = this.content.toString().split("\n");
    this.cursor = 0;
  }

  percentage() {
    return Math.floor(100 * ((this.cursor - 1) / this.commands.length));
  }

  next() {
    let command = this.commands[this.cursor++];

    if (command == null) {
      return null;
    }

    // Apply template to it
    let params = this.options.params || {};
    command = format(command, params);

    return command;
  }
}
