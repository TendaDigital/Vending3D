import chalk from 'chalk'
import { JobRequest } from '../../JobRequest'
import { JobStatusMessage, Printer, PrinterConfig, PrinterStatusMessage } from '../../Types'
import DetectBestDriver from './DetectBestDriver'
import PrinterBase from './PrinterBase'
import Sleep from '../../Util/Sleep'
import GcodeParser from '../../Util/GCodeParser'

export namespace MarlinDriver {
  class MarlinPrinter implements Printer {
    config: PrinterConfig

    printer: PrinterBase
    constructor(printerConfig: PrinterConfig) {
      this.config = printerConfig

      const PrinterDriver = DetectBestDriver(printerConfig)
      this.printer = new PrinterDriver(printerConfig)
      // console.log()
      // console.log(chalk.yellow(' # Connect to Printer'), printerConfig.name)
    }
    async connect() {
      // Wait printer to be ready
      console.log(chalk.yellow(' . Connecting to USB...'))
      await this.printer.ready()
      console.log(chalk.yellow(' . Connected'))
    }

    #ready = false
    async *waitToBeReady(): AsyncGenerator<PrinterStatusMessage> {
      if (this.#ready) {
        return
      }

      for await (const loop of this.printer.waitForButtonPress()) {
        yield {
          type: 'printer',
          status: 'waiting',
          message: 'Waiting printer to be ready...',
        }
      }
      this.#ready = true
      // yield {
      //   type: 'printer',
      //   status: 'waiting',
      //   message: 'Waiting printer to be ready...',
      // }
    }
    async *printJob(job: JobRequest): AsyncGenerator<JobStatusMessage> {
      const file = await job.loadFile()

      // Convert ArrayBuffer to UTF-8 String
      const fileContent = new TextDecoder('utf-8').decode(file)

      yield {
        type: 'job',
        status: 'running',
        message: 'Starting job...',
        progress: 0,
      }

      const gcode = new GcodeParser(fileContent, this.config?.marlin?.config ?? {})

      // let line = 0
      this.#ready = false
      for await (const line of gcode) {
        if (line === null) continue
        yield {
          type: 'job',
          status: 'running',
          message: `Printing job...`,
          progress: gcode.percentage(),
        }
        // console.log(chalk.yellow(' . Sending line:'), gcode.percentage())
        await this.printer.command(line)
      }
    }
  }
  export function build(printerConfig: PrinterConfig): Printer {
    return new MarlinPrinter(printerConfig)
  }
}
