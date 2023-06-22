import io from 'socket.io-client'
import chalk from 'chalk'
import axios from 'axios'
import prettyBytes from 'pretty-bytes'

export default class PoolWorker {
  constructor(iam, opts = {}) {
    this.iam = iam
    this.socket = io(opts.url, opts)
    this.socketURL = opts.url
    this.restURL = opts.restURL || opts.url.replace(/^ws/, 'http').replace(/\?.+/, '')
  }

  connect() {
    if (!this._connect) {
      this._connect = new Promise((resolve, reject) => {
        this.socket.once('error', (msg) => {
          console.error(chalk.red(' ! Error connecting to pool: ' + msg))
          reject()
          this.socket.disconnect(true)
        })
        this.socket.once('connect', () => setTimeout(resolve, 500))
      })
    }

    return this._connect
  }

  pool() {
    let resolved = false
    this.socket.off('job')
    return new Promise((resolve, reject) => {
      this.socket.once('job', (data) => {
        if (resolved) return
        resolved = true

        if (!data) return resolve(null)

        resolve(new Job(this, data))
      })

      setTimeout(() => {
        if (resolved) return

        resolved = true
        resolve(null)
      }, 1000)

      this.socket.emit('pool')
    })
  }

  setPrinterStatus(status, payload) {
    this.socket.emit('printerStatus', { status, payload })
  }
}

class Job {
  constructor(worker, data) {
    if (!data) throw new Error('No job data set')
    if (!data.id) throw new Error('No id set on job')
    if (!data.status) throw new Error('No status set on job')

    this.worker = worker
    this.data = Object.assign(
      {
        id: null,
        status: '',
        message: '',
        progress: -1,
        payload: {},
      },
      data
    )

    this.stopped = false

    this.id = data.id
    this.topic = 'job:' + this.id

    this.worker.socket.on(this.topic, (data) => this.handleEvent(data))
  }

  handleEvent(data) {
    // console.log('handleEvent', data)

    // Skip if not the job itself
    if (!data || data.id != this.id) return

    // Stop if job is not running or queued
    if (!['running', 'queued'].includes(data.status)) {
      // Turn off events and set stopped flag
      this.worker.socket.off(this.topic)
      this.stopped = true
    }

    Object.assign(this.data, data)
  }

  async getTaskFile() {
    // console.log("getTaskFile", this);
    // return "";
    // await axios({
    //   url: this.worker.
    // })

    const url = this.worker.restURL + '/tasks/' + this.id + '/file'
    console.log(chalk.grey(' ? fetch file: ' + url))
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'blob',
    })
    // Format size in MB/KB/Bytes using library
    const fileSize = prettyBytes(response.data.length)
    console.log(chalk.grey(` ? loaded file: ${fileSize}`))
    return response.data
  }

  update(payload) {
    // Object.assign(this.data, payload)
    this.worker.socket.emit('job', { id: this.id, payload })
  }

  setStatus(status, message) {
    this.update({ status, message })
  }

  setProgress(progress) {
    this.update({ progress })
  }
}
