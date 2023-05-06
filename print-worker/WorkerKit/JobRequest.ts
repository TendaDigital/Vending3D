import { Job, JobStatus } from './Types'
import { ServerConnection } from './ServerConnection'

export class JobRequest {
  server: ServerConnection
  job: Job
  topic: string
  stopped: boolean

  startedAt: number
  constructor(server: ServerConnection, job: Job) {
    if (!job) throw new Error('No job data set')
    if (!job.id) throw new Error('No id set on job')
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
    this.topic = 'job:' + this.job.id
    this.server.socket.on(this.topic, (data) => this.handleEvent(data))
  }

  get id() {
    return this.job.id
  }

  get name() {
    return this.job.name
  }

  handleEvent(data) {
    // console.log('handleEvent', data)

    // Skip if not the job itself
    if (!data || data.id != this.id) return

    // Stop if job is not running or queued
    if (!['running', 'queued'].includes(data.status)) {
      // Turn off events and set stopped flag
      console.log('Job is not running or queued, stopping...')
      this.server.socket.off(this.topic)
      this.stopped = true
    }

    Object.assign(this.job, data)
  }

  update(payload) {
    this.server.socket.emit('job', { id: this.id, payload })
  }

  updateStatus({ status, message, progress }: { status?: JobStatus; message?: string; progress?: number } = {}) {
    this.update({ status, message, progress })
  }

  assertNotStopped() {
    if (this.stopped) throw new Error('Job was stopped by server')
  }

  #file: ArrayBuffer | null = null
  async loadFile() {
    if (this.#file) return this.#file
    return (this.#file = await this.server.getTaskFile(this))
  }
}
