import { existsSync, readFileSync, writeFileSync } from 'fs'
import { GlobalConfig, PrinterConfig, ServerConfig } from './Types'

export class Settings {
  #sourceFile: string
  #settings: GlobalConfig

  constructor(sourceFile = 'printers.json') {
    this.#sourceFile = sourceFile
    // Check if settings file exists
    if (!existsSync(this.#sourceFile)) {
      // Create settings file
      writeFileSync(
        this.#sourceFile,
        JSON.stringify(
          {
            server: {},
            printers: [],
          },
          null,
          2
        )
      )
    }
    this.#settings = this.loadSettingsFile()
  }

  loadSettingsFile(): GlobalConfig {
    const obj = JSON.parse(readFileSync(this.#sourceFile, 'utf8')) as GlobalConfig
    // Freeze object
    Object.freeze(obj.printers)
    obj.printers.forEach((printer) => Object.freeze(printer))
    Object.freeze(obj.server)

    // Return freezed object
    return Object.freeze(obj)
  }

  // set settings(settings: GlobalConfig) {
  //   writeFileSync(this.#sourceFile, JSON.stringify(settings, null, 2))
  // }

  get printers(): PrinterConfig[] {
    return this.#settings.printers
  }

  get server(): ServerConfig {
    return this.#settings.server
  }

  printerConfig(name: string): PrinterConfig {
    if (!name) throw new Error(`Printer name not provided. Use "yarn start <printer-name>"`)
    const printer = this.printers.find((printer) => printer.name === name)
    if (!printer) throw new Error(`Printer "${name}" not found`)
    return printer
  }

  // set printers(printers: PrinterConfig[]) {
  //   this.settings = { ...this.settings, printers }
  // }
}
