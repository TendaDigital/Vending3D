const _ = require('lodash')
const chalk = require('chalk')
const inquirer = require('inquirer')
const SerialPort = require('serialport')

const draftlog = require('draftlog').into(console).addLineListener(process.stdin)

const Printer = process.env.MOCK ? require('./prusa/PrinterMock') : require('./prusa/PrinterPrusa')
const GcodeParser = require('./prusa/GcodeParser')

const sleep = require('./sleep')
const PoolWorker = require('./PoolWorker')

let printerInfo = null

async function loadPrinterInfo() {
  let printers = require('./printers')
  
  if (process.env.MOCK) {
    let name = process.env.PRINTER || 'Mocked Printer'
    return {
      name,
      port: {
        serialNumber: 'MOCKED:' +  name
      }
    }
  }

  if (process.env.PRINTER) {
    // try finding it
    let printer = _.find(printers, {name: process.env.PRINTER})
    if (printer) return printer;
  }

  // Try matching terminal session to printer
  let TERM_SESSION_ID = process.env.TERM_SESSION_ID
  let printer = _.find(printers, {TERM_SESSION_ID})

  if (printer) return printer;

  console.log(await SerialPort.list())

  // Try asking one of
  let choice = (await inquirer.prompt({
    type: 'list',
    name: 'value',
    message: 'Escolha uma impressora:',
    choices: printers.map(p => ({name: p.name, value: p})),
  })).value

  if (!choice) {
    console.error('Nenhuma impressora definida para este worker. Encerrando.')
    process.exit(1)
  }

  // Save to json
  printers = printers.map(test => {
    if (test == choice) {
      test.TERM_SESSION_ID = TERM_SESSION_ID
    }
    return test
  })

  console.log('saving')
  require('fs').writeFileSync('./printers.json', JSON.stringify(printers, null, 2))

  return choice
}

async function getPoolOptions() {
  return {
    url: 'http://localhost:9077?printer='+printerInfo.name,
  }
}

async function getPrinterOptions() {
  // console.log(await SerialPort.list())

  return {
    debug: false,
    name: printerInfo.name,
    // port: {serialNumber: 'CZPX2617X003XK24982'},
    // port: {serialNumber: 'CZPX2617X003XK25033'},
    // port: {serialNumber: 'CZPX2617X003XK24826'},
    port: printerInfo.port,
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
  printerInfo = await loadPrinterInfo()
  let poolOpts = await getPoolOptions()
  let printerOpts = await getPrinterOptions()

  // Configs
  console.log()
  console.log(chalk.green(' # =================='))
  console.log(chalk.green(' #    PRINTER', printerInfo.name))
  console.log(chalk.green(' # =================='))

  // The printer interface
  let printer = new Printer(printerOpts)
  console.log()
  console.log(chalk.yellow(' # Connect to Printer'), printerOpts.port.serialNumber)

  // Wait printer to be ready
  await printer.connect()
  console.log(chalk.yellow(' . Connected to USB, waiting to be ready'))
  await printer.ready()
  console.log(chalk.yellow(' . Ready, waiting for button press...'))

  // Beep twice
  await printer.beep()
  await sleep(50)
  await printer.beep()

  // Wait printer to be ok
  console.log(chalk.yellow(' . Finished'))

  // The master interface
  let master = new PoolWorker(printerOpts.name, poolOpts)
  console.log()
  console.log(chalk.yellow(' # Connect to Server Pool'), poolOpts.url)

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
    console.log(chalk.yellow(' # Waiting for button press'))
    await printer.waitForButtonPress('[press] ' + _.get(job, 'data.payload.description', ''))

    // Start a new job
    job = null
    let pooling = draftLoading(chalk.yellow(' # Waiting for a new job'))

    await printer.display('  Tenda ' + printerInfo.name)

    // Keep pooling
    while(1) {
      printerStatus = 'idle'
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
  if (!job) throw new Error('job não definido');

  console.log(chalk.green(' # Iniciando job'), job._id)

  let progress = draftProgress(chalk.yellow(' # Progresso: '), 20)
  try {
    let payload = job.data.payload
    if (!payload.file) throw new Error('file é obrigatório na payload');

    let gcode = new GcodeParser(payload.file, payload.gcodeParams || {})

    job.setStatus('running', 'Executando...')
    await printer.display((payload.name || '') + ' - ' + (payload.description || ''))

    let lastShownDisplay = -1
    let lastPercentageUpdate = -1
    while(true) {
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
        break;
      }

      // Run command
      await printer.command(nextCommand)

      // Get percentage, and update job percentage if needed
      let percentage = Math.floor(gcode.percentage())
      if (Date.now() > lastPercentageUpdate + 1000) {
        lastPercentageUpdate = Date.now();
        
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
    progress(100)
    job.setProgress(100)
    job.setStatus('success', 'Completo!')
    console.log(chalk.green(' # complete'))
  } catch (e) {
    job.setStatus('failed', String(e))
    console.log(chalk.red(' # failed:'), String(e.stack))
  }
}

// Listen for Application wide errors
process.on('unhandledRejection', handleError)
process.on('uncaughtException', handleError)

function handleError(e) {
  console.error('Fatal Error')
  console.error(e)
  console.error(e.stack)

  console.error('Exiting.')
  process.exit(1)
}

main()