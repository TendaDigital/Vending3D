import { Socket, io } from 'socket.io-client'
import chalk from 'chalk'
import axios from 'axios'
import prettyBytes from 'pretty-bytes'
import { JobRequest } from './JobRequest'
import { ServerConfig, PrinterConfig, Printer } from './Types'
import { Driver } from './Drivers'
import { ServerConnection } from './ServerConnection'
import { PromiseWithTimeout } from './Util/PromiseWithTimeout'

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
      await PromiseWithTimeout(this.printer.connect(), 5000, new Error('Connection with printer timed out'))

      // Connect to server
      console.log(TAG, chalk.grey('Connecting to server'), chalk.white(this.server.config.url))
      await PromiseWithTimeout(this.server.connect(), 5000, new Error('Connection with server timed out'))
      console.log(TAG, chalk.yellow(`Connection stablished`))

      while (this.#running) {
        // Wait for printer to be ready
        console.log(TAG, chalk.grey('Waiting printer to be ready...'))
        await this.server.setPrinterStatus('awaiting', {})
        await this.printer.waitToBeReady()

        // Wait for job
        console.log(TAG, chalk.grey('Waiting for a new job to be available...'))
        await this.server.setPrinterStatus('idle', {})
        const job = await this.server.waitForJob(5000)

        if (!job) {
          console.log(TAG, chalk.grey('No job available'))
          continue
        }

        try {
          console.log(TAG, chalk.yellow('🖨 Printing new job'), chalk.white(job._id))
          await this.server.setPrinterStatus('printing', {})
          job.updateStatus({
            status: 'printing',
            message: 'Imprimindo...',
            progress: 0,
          })

          // Print job
          await this.printer.printJob(job)

          // Notify server that job is done
          // Format duration to human readable
          const duration = (Date.now() - job.startedAt).toLocaleString('pt-BR')
          console.log(TAG, chalk.yellow(`✅ Job is done.`), `Took ${duration}ms`)
          job.updateStatus({
            status: 'success',
            message: 'Concluído com sucesso',
            progress: 100,
          })
        } catch (e) {
          console.error(TAG, chalk.red('🚨 Failed to print job: ' + e.stack))
          job.updateStatus({
            status: 'failed',
            message: 'Falha ao imprimir: ' + e.message,
          })
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
