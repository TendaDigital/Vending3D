import prettyBytes from 'pretty-bytes'
import Worker from './PrinterWorker'
import { Job } from './Types'
import { ServerConnection } from './ServerConnection'

export class JobRequest {
  server: ServerConnection
  job: Job
  topic: string
  stopped: boolean

  startedAt: number
  constructor(server: ServerConnection, job: Job) {
    if (!job) throw new Error('No job data set')
    if (!job._id) throw new Error('No _id set on job')
    if (!job.status) throw new Error('No status set on job')

    this.startedAt = Date.now()
    this.server = server
    this.job = Object.assign(
      {
        message: null,
        progress: -1,
      },
      job
    )

    this.stopped = false

    // this._id = data._id
    this.topic = 'job:' + this.job._id

    this.server.socket.on(this.topic, (data) => this.handleEvent(data))
  }

  get _id() {
    return this.job._id
  }

  handleEvent(data) {
    // console.log('handleEvent', data)

    // Skip if not the job itself
    if (!data || data._id != this._id) return

    // Stop if job is not running or queued
    if (!['running', 'queued'].includes(data.status)) {
      // Turn off events and set stopped flag
      this.server.socket.off(this.topic)
      this.stopped = true
    }

    Object.assign(this.job, data)
  }

  update(payload) {
    this.server.socket.emit('job', { _id: this._id, payload })
  }

  updateStatus({
    status,
    message,
    progress,
  }: {
    status?: 'failed' | 'success' | 'printing' | 'queued'
    message?: string
    progress?: number
  }) {
    this.update({ status, message, progress })
  }

  getFile() {
    return this.server.getTaskFile(this)
  }
}
