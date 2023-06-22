import dotenv from 'dotenv'
import chalk from 'chalk'
// import sleep from './sleep.js'
import { Settings } from './WorkerKit/Settings'
import PrinterWorker from './WorkerKit/PrinterWorker'
import { Driver } from './WorkerKit/Drivers'
import { MarlinDriver } from './WorkerKit/Drivers/Marlin'
import { CupsDriver } from './WorkerKit/Drivers/Cups'

dotenv.config()

async function main() {
  // Register drivers
  Driver.register('marlin', MarlinDriver.build)
  Driver.register('cups', CupsDriver.build)

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

async function main2() {
  // Load configs
  let printerInfo = await loadPrinterInfo()
  let poolOpts = await getPoolOptions(printerInfo)
  let printerOpts = await getPrinterOptions(printerInfo)

  // Set debug flag to assist
  if (process.env.DEBUG) printerOpts.debug = true

  // Configs
  console.log()
  console.log(chalk.green(' # =================='))
  console.log(chalk.green(' # PRINTER', printerInfo.name))
  console.log(chalk.green(' # =================='))

  // The printer interface
  const PrintDriver = detectBestDeviceDriver(printerOpts)
  let printer = new PrintDriver(printerOpts)
  console.log()
  console.log(chalk.yellow(' # Connect to Printer'), printerOpts.name)

  // Wait printer to be ready
  console.log(chalk.yellow(' . Connecting to USB'))
  console.log(chalk.yellow(' . Waiting printer to be ready...'))
  await printer.ready()
  console.log(chalk.yellow(' . Ready, waiting for button press...'))

  // Bind this TERM_SESSION to the Printer
  await bindTerminalToPrinter(printerInfo)

  // Beep twice
  await printer.beep()
  await sleep(50)
  await printer.beep()

  // Wait printer to be ok
  console.log(chalk.yellow(' . Finished'))

  // The master interface
  let master = new PoolWorker(printerOpts.name, poolOpts)
  console.log()
  console.log(chalk.yellow(' # Connect to Server Pool'), decodeURI(poolOpts.url).replace(/\s/g, '+'))

  // Wait master interface to be ready
  await master.connect()

  console.log(chalk.yellow(' . Ready'))

  // Global printer status flag
  let printerStatus = 'waiting'
  setInterval(() => {
    master.setPrinterStatus(printerStatus, printer.state)
  }, 250)

  async function readTemperature() {
    try {
      await printer.readTemperature()
    } catch (e) {}

    setTimeout(readTemperature, 2000)
  }

  readTemperature()

  let job
  while (1) {
    console.log()

    // Wait printer to be ok
    printerStatus = 'waiting'
    console.log(chalk.yellow(' # Waiting for button press on ' + chalk.white.bold(printerInfo.name)))
    await printer.waitForButtonPress('[press] ' + _.get(job, 'data.payload.description', ''))

    // Start a new job
    job = null
    let pooling = draftLoading(
      chalk.yellow(` # Waiting for a new job on queue [${chalk.white.bold(printerInfo.queue)}]`)
    )

    await printer.display(' ' + printerInfo.name)

    // Keep pooling
    while (1) {
      printerStatus = 'idle'
      // Attempt getting a new job
      pooling()
      job = await master.pool()

      if (!job) {
        // Shutdown printer (keep heating)
        // printer.shutdown()

        // No job, delay and continue
        await sleep(600)
      } else {
        // Job found, break inner loop and continue
        break
      }
    }

    printerStatus = 'printing'

    // Beep twice
    await printer.beep(500)
    await sleep(50)
    await printer.beep()

    // Sleep to release button
    await sleep(500)

    // Job got, start printing
    // console.log()
    // console.log(chalk.yellow(' # Running...'))
    await runJob(printer, job)

    // Beep twice
    await printer.beep(200)
    await sleep(50)
    await printer.beep()
    await sleep(50)
    await printer.beep()
    await sleep(50)
    await printer.beep()

    console.log(chalk.green(' # Complete'))
  }
}

async function runJob(printer, job) {
  if (!job) throw new Error('job não definido')

  console.log(chalk.green(' # Iniciando job'), job._id)

  let progress = draftProgress(chalk.yellow(' # Progresso: '), 20)
  try {
    let payload = job.data.payload

    // if ((payload.file).toLowerCase().endsWith('.gcode'))
    const fileContents = await job.getTaskFile()
    let gcode = new GcodeParser(fileContents, payload.gcodeParams || {})

    job.setStatus('running', 'Executando...')
    await printer.display((payload.name || '') + ' - ' + (payload.description || ''))

    let lastShownDisplay = -1
    let lastPercentageUpdate = -1
    while (true) {
      if (job.stopped) {
        // throw new Error('Cancelado')
        console.log(chalk.red(' # Job cancelado pelo servidor'))
        job.setStatus('canceled', 'Cancelado pelo servidor')
        return
      }

      // Run next
      let nextCommand = gcode.next()

      // Break if finished gcode
      if (nextCommand === null) {
        break
      }

      // Run command
      await printer.command(nextCommand)

      // Get percentage, and update job percentage if needed
      let percentage = Math.floor(gcode.percentage())
      if (Date.now() > lastPercentageUpdate + 1000) {
        lastPercentageUpdate = Date.now()

        progress(percentage)
        job.setProgress(percentage)
      }

      // Update display every 10secs
      if (Date.now() > lastShownDisplay + 10000) {
        lastShownDisplay = Date.now()
        let status = 'para ' + (payload.description || '').split(' ')[0]
        await printer.display(status.padEnd(15) + (percentage + '%').padStart(5))
      }
    }

    await sleep(500)
    await printer.shutdown()

    progress(100)
    job.setProgress(100)
    job.setStatus('success', 'Completo!')
  } catch (e) {
    job.setStatus('failed', String(e))
    console.log(chalk.red(' # failed:'), String(e.stack))
  }
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
