import chalk from 'chalk'
import { ServerConfig, PrinterConfig, Printer } from './Types'
import { Driver } from './Drivers'
import { ServerConnection } from './ServerConnection'
import { PromiseWithTimeout } from './Util/PromiseWithTimeout'
import prettyBytes from 'pretty-bytes'

const TAG = chalk.grey('[PrinterWorker]')

export default class PrinterWorker {
  printer: Printer
  server: ServerConnection

  constructor(printerConfig: PrinterConfig, server: ServerConfig) {
    // Create printer instance
    this.printer = Driver.buildPrinter(printerConfig)

    // Create server connection
    this.server = ServerConnection.build(server, printerConfig)
  }

  #running = false
  async run() {
    if (this.#running) throw new Error('Worker is already running')
    this.#running = true

    try {
      console.log(TAG, chalk.yellow('Starting worker'))

      // Connect to printer
      console.log(TAG, chalk.green('Printer name:  '), chalk.white(this.printer.config.name))
      console.log(TAG, chalk.green('Printer queue: '), chalk.white(this.printer.config.queue))
      console.log(TAG, chalk.green('Printer driver:'), chalk.white(this.printer.config.driver))
      console.log(TAG, chalk.grey('Connecting to printer'))
      await PromiseWithTimeout(this.printer.connect(), 10000, new Error('Connection with printer timed out'))

      // Connect to server
      console.log(TAG, chalk.grey('Connecting to server'), chalk.white(this.server.config.url))
      await PromiseWithTimeout(this.server.connect(), 7000, new Error('Connection with server timed out'))
      console.log(TAG, chalk.yellow(`Connection stablished`))

      let newJob = true
      while (this.#running) {
        // Wait for printer to be ready
        if (newJob) console.log(TAG, chalk.white('Waiting printer to be ready...'))
        // await this.server.setPrinterStatus('waiting', {})
        let lastPrinterMessage = null
        for await (const message of this.printer.waitToBeReady()) {
          if (message.message && lastPrinterMessage !== message.message) {
            console.log(TAG, chalk.grey(`⌛️ Printer message: ${chalk.yellow(message.message)}`))
            lastPrinterMessage = message.message
          }
          await this.server.setPrinterStatus('waiting', message)
        }

        // Wait for job
        if (lastPrinterMessage) console.log(TAG, chalk.grey('Waiting for a new job to be available...'))
        await this.server.setPrinterStatus('idle', {
          message: 'Aguardando novo trabalho...',
        })
        const job = await this.server.waitForJob(0)

        if (!job) {
          newJob = false
          continue
        } else {
          newJob = true
        }

        // Build job tag
        const JOB_TAG = chalk.dim(`[${job.id}]`)

        try {
          // Draw a continuous line to prompt (without gap)
          console.log(TAG, JOB_TAG, chalk.grey('----------------------------------------'))
          console.log(TAG, JOB_TAG, chalk.yellow('🖨  New job received'), chalk.white(job.id))
          await this.server.setPrinterStatus('printing', {
            message: 'Imprimindo...',
          })
          job.updateStatus({
            status: 'running',
            message: 'Imprimindo...',
            progress: 0,
          })

          // Wait for printer to be ready
          console.log(TAG, JOB_TAG, chalk.grey('⌛️ Waiting printer to be ready...'))
          job.assertNotStopped()
          for await (const message of this.printer.waitToBeReady()) {
            await this.server.setPrinterStatus('running', message)
            await job.updateStatus()
          }

          console.log(TAG, JOB_TAG, chalk.grey(`📩 Downloading file (${job.name})`))
          job.assertNotStopped()
          const buff = await job.loadFile()
          console.log(TAG, JOB_TAG, chalk.grey(`📦 File downloaded (${prettyBytes(buff.byteLength)})`))

          // Print job
          console.log(TAG, JOB_TAG, chalk.grey('⌛️ Printing file'))
          let lastStatus = null
          let lastMessage = null
          let lastProgress = 0
          job.assertNotStopped()

          // Flags to keep track of job status, and prevent stuck jobs
          let lastProgressUpdate = Date.now()
          const MAX_PROGRESS_TIMEOUT = 60000

          for await (const message of this.printer.printJob(job)) {
            if (job.stopped) {
              console.log(TAG, JOB_TAG, chalk.grey('🛑 Job was stopped'))
              throw new Error('Job was stopped during print')
            }
            if (message.status && lastStatus !== message.status) {
              console.log(TAG, JOB_TAG, chalk.grey(`🖨  Job status is now ${chalk.yellow(message.status)}`))
              lastStatus = message.status
              lastProgressUpdate = Date.now()
            }
            if (message.message && lastMessage !== message.message) {
              console.log(TAG, JOB_TAG, chalk.grey(`🖨  Job message is now ${chalk.yellow(message.message)}`))
              lastMessage = message.message
              lastProgressUpdate = Date.now()
            }
            if (message.progress && lastProgress !== message.progress) {
              console.log(TAG, JOB_TAG, chalk.grey(`🖨  Job progress is now ${chalk.yellow(String(message.progress))}%`))
              lastProgress = message.progress
              lastProgressUpdate = Date.now()
            }

            // Check if job is stuck
            if (lastProgressUpdate + MAX_PROGRESS_TIMEOUT < Date.now()) {
              console.log(TAG, JOB_TAG, chalk.red('🚨 Job is stuck'))
              throw new Error(`Job status timeout for too long. Timeout of ${MAX_PROGRESS_TIMEOUT}ms exceeded`)
            }

            job.updateStatus(message)
          }

          // Notify server that job is done
          // Format duration to human readable
          const duration = (Date.now() - job.startedAt).toLocaleString('pt-BR')
          console.log(TAG, JOB_TAG, chalk.yellow(`✅ Job is done.`), `Took ${duration}ms`)
          job.updateStatus({
            status: 'success',
            message: 'Concluído com sucesso',
            progress: 100,
          })
          console.log(TAG, JOB_TAG, chalk.grey('----------------------------------------'))
        } catch (e) {
          console.error(TAG, JOB_TAG, chalk.red('🚨 Failed to print job: ' + e.stack))
          job.updateStatus({
            status: 'failed',
            message: 'Falha ao imprimir: ' + e.message,
          })
          console.log(TAG, JOB_TAG, chalk.grey('----------------------------------------'))
          continue
        }
      }

      // console.log(chalk.yellow(' # Connect to Server Pool'), decodeURI(poolOpts.url).replace(/\s/g, '+'))
    } catch (e) {
      console.error(TAG, chalk.red('🚨 Failed to setup worker: ' + e.message))
      throw e
    }
  }
}
