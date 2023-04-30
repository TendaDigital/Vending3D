import ipp from 'ipp'
import { Printer, PrinterConfig } from '../Types'
import { promisify } from 'util'
import Sleep from '../Util/Sleep'
import CupsParser from 'ipp/lib/parser'
import { JobRequest } from '../JobRequest'
CupsParser.handleUnknownTag = () => {
  /** do nothing */
}

export namespace CupsDriver {
  class CupsPrinter implements Printer {
    config: PrinterConfig
    printer: ipp.Printer
    constructor(config: PrinterConfig) {
      this.config = config

      if (!config.cups) throw new Error('Cups config is missing')
      if (!config.cups.url) throw new Error('Cups url is missing')

      this.printer = new ipp.Printer(config.cups.url)
      // printer.execute = promisify(printer.execute.bind(printer))
    }

    async connect() {
      console.log('CupsDriver.connect')
    }

    async waitToBeReady() {
      console.log('CupsDriver.waitToBeReady')
      do {
        await Sleep(3000)
        const status = await this.#ippStatus()
        console.log({ status })
        if (status.reasons.includes('none')) break
        // eslint-disable-next-line no-constant-condition
      } while (true)
    }

    async printJob(job: JobRequest) {
      console.log('CupsDriver.printJob', job)
      const file = await job.getFile()
      console.log('loaded file', file)
    }

    async cancelJob() {
      console.log('CupsDriver.cancelJob')
    }

    async #ippStatus(): Promise<{ message: string; reasons: string[] }> {
      return new Promise((resolve, reject) => {
        this.printer.execute('Get-Printer-Attributes', null, (err, res) => {
          if (err) {
            return reject(err)
          }
          const tags = res['printer-attributes-tag']
          const state = {
            message: tags?.['printer-state-message'],
            // Make sure it is an array
            reasons: [].concat(tags?.['printer-state-reasons']),
          }
          resolve(state)
        })
      })
    }
  }

  export function build(printerConfig: PrinterConfig): Printer {
    return new CupsPrinter(printerConfig)
  }

  // export function execute(printer: ipp.Printer, command: string, data: any): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     printer.execute(command, data, (err, res) => {
  //       if (err) return reject(err)
  //       resolve(res)
  //     })
  //   })
  // }
}
