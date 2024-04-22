import { PrinterConfig } from '../../Types.js'
import BarcodeScanner from './printers/BarcodeScanner.js'
import PrinterEnder from './printers/PrinterEnder.js'
import PrinterMock from './printers/PrinterMock.js'
import PrinterPrusa from './printers/PrinterPrusa.js'
import PrinterVPlotter from './printers/PrinterVPlotter.js'

/**
 * Call this method with a SerialPort device spec to
 * find the appropiate Printer device instance and use it
 */
export default function DetectBestDriver(hints: PrinterConfig) {
  const Drivers = [
    PrinterMock,
    PrinterVPlotter,
    //  PrinterPrusa,
    PrinterEnder,
    BarcodeScanner,
  ]
  const Driver = Drivers.find((Driver) => Driver.model === hints.marlin.model)

  if (!Driver) {
    console.error('No Driver detected with hints:', JSON.stringify(hints))
    throw new Error(`Could not detect available Driver for printer with available hints`)
  }

  return Driver
}
