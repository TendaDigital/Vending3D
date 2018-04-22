const _ = require('lodash')
const chalk = require('chalk')
const SerialPort = require('serialport')

const draftlog = require('draftlog').into(console).addLineListener(process.stdin)

const Printer = require('./prusa/Printer')
const GcodeParser = require('./prusa/GcodeParser')

const sleep = require('./sleep')
const PoolWorker = require('./PoolWorker')

async function getPoolOptions() {
  return {
    url: 'http://localhost:9077',
  }
}

async function getPrinterOptions() {
  // console.log(await SerialPort.list())

  return {
    debug: false,
    name: 'PRINTER 5',
    // port: {serialNumber: 'CZPX2617X003XK24982'},
    // port: {serialNumber: 'CZPX2617X003XK25033'},
    // port: {serialNumber: 'CZPX2617X003XK24826'},
    port: {comName: '/dev/tty.JOAO_S2_IVAN-DevB'},
    params: {
      temperatureExtruder: 200,
      temperatureBed: 60,
      babyHeight: '1.4',
      printOffset: 0
    }
  }
}

function draftFrames(frames) {
  let i = 0
  let draft = console.draft(frames[0])
  return () => {
    if (++i >= frames.length) i = 0;
    draft(frames[i])
  }
}

function draftLoading(phrase) {
  return draftFrames([
    phrase + '',
    phrase + '.',
    phrase + '..',
    phrase + '...',
    phrase + '....',
    phrase + '...',
    phrase + '..',
    phrase + '.',
  ])
}

function draftProgress(phrase, len) {
  let draft
  return (progress) => {
    let perc = (Math.floor(progress) + '%').padStart(6)
    let fill = Math.floor(len / 100 * progress)
    let stat = phrase + chalk.green('[' + '#'.repeat(fill) + '='.repeat(len - fill) + ']' + perc)

    draft = draft || console.draft()
    draft(stat)
  }
}


async function main() {
  // Load configs
  let poolOpts = await getPoolOptions()
  let printerOpts = await getPrinterOptions()

  // The master interface
  let master = new PoolWorker(printerOpts.name, poolOpts)
  console.log()
  console.log(chalk.yellow(' # Connect to Server Pool'), poolOpts.url)

  // Wait master interface to be ready
  await master.connect()

  // Notify who iam


  // The printer interface
  let printer = new Printer(printerOpts)
  console.log()
  console.log(chalk.yellow(' # Connect to Printer'), printerOpts.port.serialNumber)

  // Wait printer to be ready
  await printer.connect()
  console.log(chalk.yellow(' . Connected to USB, waiting to be ready'))
  // await printer.ready()
  console.log(chalk.yellow(' . Ready, waiting for button press...'))

  // Wait printer to be ok
  // await printer.waitForButtonPress()
  console.log(chalk.yellow(' . Finished'))

  console.log(chalk.yellow(' . Ready'))

  while (1) {
    console.log()
    let pooling = draftLoading(chalk.yellow(' # Waiting for a new job'))
    let job = null

    // Keep pooling
    while(1) {
      // Attempt getting a new job
      pooling()
      job = await master.pool()

      if (!job) {
        // No job, delay and continue
        await sleep(100)
      } else {
        // Job found, break inner loop and continue
        break;
      }
    }

    // Sleep to release button
    await sleep(500)

    // Job got, start printing
    // console.log()
    // console.log(chalk.yellow(' # Running...'))
    await runJob(printer, job)

    // Wait printer to be ok
    // console.log()
    console.log(chalk.yellow(' # Restart required. Press button to continue'))
    // await printer.waitForButtonPress()
  }
}



async function runJob(printer, job) {
  if (!job) throw new Error('job não definido');

  console.log(chalk.green(' # Iniciando job'), job._id)

  let progress = draftProgress(chalk.yellow(' # Progresso: '), 20)
  try {
    let payload = job.data.payload
    if (!payload.file) throw new Error('file é obrigatório na payload');

    let gcode = new GcodeParser(payload.file, payload.gcodeParams || {})

    job.setStatus('running', 'Executando...')

    let lastPercentage = -1;
    while(true) {
      if (job.stopped) {
        throw new Error('Cancelado')
      }

      // Run next 
      let nextCommand = gcode.next()

      // Break if finished gcode
      if (!nextCommand) {
        break;
      }

      // Run command
      // await printer.command(nextCommand)

      // Get percentage, and update job percentage if needed
      let percentage = Math.floor(gcode.percentage())
      if (percentage != lastPercentage) {
        lastPercentage = percentage;
        job.setProgress(percentage)

        progress(percentage)
      }
    }
    
    progress(100)
    job.setProgress(100)
    job.setStatus('success', 'Completo!')
    console.log(chalk.green(' # complete'))
  } catch (e) {
    job.setStatus('failed', String(e))
    console.log(chalk.red(' # failed:'), String(e))
  }
}

// Listen for Application wide errors
process.on('unhandledRejection', handleError)
process.on('uncaughtException', handleError)

function handleError(e) {
  console.error('Fatal Error')
  console.error(e.stack)

  console.error('Exiting.')
  process.exit(1)
}

main()