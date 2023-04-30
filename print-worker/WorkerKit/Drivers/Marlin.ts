import { Printer, PrinterConfig } from '../Types'
import Sleep from '../Util/Sleep'

export namespace MarlinDriver {
  class MarlinPrinter implements Printer {
    config: PrinterConfig

    constructor(printerConfig: PrinterConfig) {
      this.config = printerConfig
    }

    async connect() {
      console.log('MarlinDriver.connect')
    }

    async waitToBeReady() {
      console.log('MarlinDriver.waitToBeReady')
    }

    async printJob(job) {
      console.log('MarlinDriver.printJob')
    }

    async cancelJob() {
      console.log('MarlinDriver.cancelJob')
    }
  }
  export function build(printerConfig: PrinterConfig): Printer {
    return new MarlinPrinter(printerConfig)
  }
}
