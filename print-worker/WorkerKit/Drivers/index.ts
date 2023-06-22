import { Printer, PrinterConfig } from '../Types'

export namespace Driver {
  const drivers = {}
  export function buildPrinter(printerConfig: PrinterConfig): Printer {
    if (!printerConfig.driver) throw new Error(`Printer configuration should include "driver" as one of `)
    if (!drivers[printerConfig.driver]) throw new Error(`Driver "${printerConfig.driver}" not found`)
    return drivers[printerConfig.driver](printerConfig)
  }

  export function register(name: string, driver: (PrinterConfig) => Printer) {
    if (drivers[name]) throw new Error(`Driver "${name}" already registered`)
    drivers[name] = driver
  }
}
