import { Socket, SocketOptions, io } from 'socket.io-client'
import { Job, PrinterConfig, ServerConfig } from './Types'
import chalk from 'chalk'
import { JobRequest } from './JobRequest'
import Sleep from './Util/Sleep'
import { PromiseWithTimeout } from './Util/PromiseWithTimeout'
import prettyBytes from 'pretty-bytes'
import axios from 'axios'

const TAG = '[ServerConnection]'
export class ServerConnection {
  config: ServerConfig
  socket: Socket
  uri: string
  connectionQuery: Record<string, string>

  static build(config: ServerConfig, printerConfig: PrinterConfig) {
    // Create socket connection with server
    return new ServerConnection(config, {
      name: printerConfig.name,
      queue: printerConfig.queue,
    })
  }

  debug(...args: any[]) {
    console.log(chalk.gray(TAG), ...args)
  }

  constructor(config: ServerConfig, connectionQuery: Record<string, string> = {}, uri = config.url) {
    this.config = config
    this.uri = uri
    this.connectionQuery = connectionQuery
  }

  #connecting: Promise<void> = null
  /**
   * Promise that resolves when connection is established
   */
  connect() {
    if (this.#connecting == null) {
      // Create socket connection with server
      // this.debug('Connecting to Server URL:', chalk.yellow(this.uri), this.connectionQuery)
      this.socket = io(this.uri, {
        query: this.connectionQuery,
      })
      this.#connecting = new Promise((resolve, reject) => {
        this.socket.on('*', (event, data) => {
          this.debug(chalk.grey(' ? Event: ' + event), data)
        })
        this.socket.once('error', (msg) => {
          console.error(chalk.red(' ! Error connecting to pool: ' + msg))
          reject()
          this.socket.disconnect()
        })
        this.socket.once('register', () => {
          // this.debug(chalk.grey(' ? Connected to pool'))
          setTimeout(resolve, 100)
        })
      })
    }

    return this.#connecting
  }

  /**
   * Promise that resolves to a JobRequest when a job is available
   * @returns JobRequest
   */
  async waitForJob(timeout: number): Promise<JobRequest> {
    const start = Date.now()
    do {
      const job = await PromiseWithTimeout(this.poolForJob(), 5000, new Error('Pooling server timed out'))
      if (job) return job
      await Sleep(200)
    } while (Date.now() - start < timeout)

    return null
  }

  /**
   * Promise that resolves to a JobRequest or null if no job is available
   * @returns JobRequest or null
   */
  poolForJob(): Promise<JobRequest | null> {
    let resolved = false
    this.socket.off('job')
    return new Promise((resolve) => {
      this.socket.once('job', (data) => {
        if (resolved) return
        resolved = true

        if (!data) return resolve(null)

        resolve(new JobRequest(this, data))
      })
      this.socket.emit('pool')
    })
  }

  setPrinterStatus(status, payload) {
    this.socket.emit('printerStatus', { status, payload })
  }

  async getTaskFile(job: JobRequest) {
    const url = this.config.url + '/tasks/' + job.id + '/file'
    // console.log(chalk.grey(' ? fetch file: ' + url))
    const response = await axios<ArrayBuffer>({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    })
    // Format size in MB/KB/Bytes using library
    // console.log(response)
    // const fileSize = prettyBytes(response.data.byteLength)
    // console.log(chalk.grey(` ? loaded file: ${fileSize}`))
    return response.data
  }
}
