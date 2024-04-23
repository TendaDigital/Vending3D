import dotenv from 'dotenv'
import chalk from 'chalk'
// import sleep from './sleep.js'
import { Settings } from './WorkerKit/Settings'
import PrinterWorker from './WorkerKit/PrinterWorker'
import { Driver } from './WorkerKit/Drivers'
import { MarlinDriver } from './WorkerKit/Drivers/Marlin'
import { CupsDriver } from './WorkerKit/Drivers/Cups'
// import { OpticomDriver } from './WorkerKit/Drivers/Opticon'

dotenv.config()

async function main() {
  // Register drivers
  Driver.register('marlin', MarlinDriver.build)
  Driver.register('cups', CupsDriver.build)
  // Driver.register('opticon', OpticomDriver.build)

  // Load printer name from args
  const printerName = process.argv[2]

  // Load settings
  const settings = new Settings('printers.json')
  const printerConfig = settings.printerConfig(printerName)

  console.log('Printer config:', printerConfig)

  // Build executor
  const worker = new PrinterWorker(printerConfig, settings.server)

  await worker.run()
}

// Listen for Application wide errors
process.on('unhandledRejection', handleError)
process.on('uncaughtException', handleError)

function handleError(e) {
  console.log()
  console.error(chalk.red(' ! Fatal Error. Exiting...'))
  console.log()

  if (e) {
    console.error(e)
    console.error('stack:', e?.stack)
  }

  process.exit(1)
}

main()
