import Integration from './Integration'
import { IntegrationProdider } from './IntegrationProvider'
import EstandeDigital_Leads from './integrations/EstandeDigital_Leads'
import Task from './Task'

export interface IntegrationDeamonConfig {
  name: string
  type: string
  queue: string
  options: object
}

export default class IntegrationDeamon {
  private constructor(protected config: IntegrationDeamonConfig, protected provider: IntegrationProdider) {}

  static async build(config: IntegrationDeamonConfig) {
    switch (config.type) {
      case 'EstandeDigital_Leads':
        return new IntegrationDeamon(config, new EstandeDigital_Leads())
      default:
        throw new Error(`Unknown integration type: ${config.type}`)
    }
  }

  async getDoc() {
    await Integration.updateOne({ name: this.config.name }, { $set: this.config }, { upsert: true, limit: 1 })
    return await Integration.findOne({ name: this.config.name })
  }
  async getCursor() {
    const doc = await this.getDoc()
    return doc.cursor
  }

  async setCursor(cursor: object) {
    await Integration.updateOne(
      { name: this.config.name },
      { $set: { cursor, lastSyncAt: cursor ? new Date() : undefined } }
    )
  }

  private syncing = false
  async sync() {
    if (this.syncing) throw new Error('Sync is already running')
    try {
      this.syncing = true
      const results = await this.provider.fetchJobs(this.config.options, await this.getCursor())

      // Save Tasks
      for (const task of results.tasks) {
        if (await Task.findOne({ refId: task.id })) continue
        const taskObj = { refId: task.id, file: task.file, queue: this.config.queue }
        console.log(taskObj)
        await Task.create(taskObj)
      }

      console.log('Synced', results.tasks.length, 'tasks', 'cursor:', results.cursor)
      await this.setCursor(results.cursor)
    } finally {
      this.syncing = false
    }
  }

  private running = false
  async start() {
    if (this.running) throw new Error('Deamon is already running')
    console.log('Starting deamon')
    await this.setCursor(null)
    try {
      this.running = true
      let lastSync = 0
      const intervals = [1000 * 5, 1000 * 10, 1000 * 20, 1000 * 30] // 10 seconds
      let failures = 0
      let currentInterval = intervals[0]
      while (this.running) {
        // Wait if less than interval
        const remaining = currentInterval - (Date.now() - lastSync)
        if (remaining > 0) {
          console.log('Waiting', remaining, 'ms')
          await Sleep(remaining)
        }
        lastSync = Date.now()
        try {
          console.log('Syncing...')
          await this.sync()
          failures = 0
        } catch (e) {
          // Backoff
          failures++
          console.error(`Failed to sync [${failures} times]`, e.message, e.response?.data)
        }
        currentInterval = intervals[Math.min(failures, intervals.length - 1)]
      }
    } finally {
      this.running = false
    }
  }
}

function Sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
