import _ from 'lodash'
import Task from './Task'
import Printer from './Printer.js'
import chalk from 'chalk'

export default class PoolServer {
  constructor() {
    this.printers = {}
  }

  async register(printerInfo) {
    if (!printerInfo) throw new Error("Cannot connect without 'printerInfo'")
    if (!printerInfo.name) throw new Error("Cannot connect without 'name'")
    if (!printerInfo.queue) throw new Error("Cannot connect without 'queue'")

    if (this.printers[printerInfo.name]) {
      throw new Error(`Printer "${printerInfo.name}" is trying to double connect to server`)
    }

    this.printers[printerInfo.name] = printerInfo

    const printer = await Printer.findOneAndUpdate(
      { name: printerInfo.name },
      {
        $set: {
          active: true,
          name: printerInfo.name,
          queue: printerInfo.queue,
          pingAt: new Date(),
        },
      },
      { new: true, upsert: true }
    )

    // Remove all jobs from this printer
    await this.resetJobsFromPrinter(printerInfo)

    return printer
  }

  async unregister(printerInfo) {
    if (!printerInfo) throw new Error("Cannot disconnect without 'printerInfo'")

    if (this.printers[printerInfo.name]) {
      delete this.printers[printerInfo.name]
    }

    const printer = await Printer.findOneAndUpdate(
      { name: printerInfo.name },
      {
        $set: {
          connected: false,
        },
      },
      { new: true }
    )

    // Remove all jobs from this printer
    await this.resetJobsFromPrinter(printerInfo)

    return printer
  }

  async findJobAndLock(printerInfo) {
    if (!printerInfo) throw new Error("Cannot lock without 'printerInfo'")
    if (!printerInfo.name) throw new Error("Cannot lock without 'name'")
    if (!printerInfo.queue) throw new Error("Cannot lock without 'queue'")

    const doc = await Task.findOneAndUpdate(
      {
        $or: [
          {
            queue: printerInfo.queue,
            lockedAt: null,
            status: 'queued',
          },
          {
            queue: printerInfo.queue,
            lastPingAt: { $lt: new Date(Date.now() - 1000 * 60 * 10) },
            status: 'queued',
          },
        ],
      },
      {
        $set: {
          owner: printerInfo.name,
          lockedAt: new Date(),
        },
      },
      { new: true, sort: { createdAt: 1 } }
    )

    return doc
  }

  async updateJob(_id, update) {
    const job = await Task.findOne({ _id })

    if (!job) return null

    job.set(_.pick(update, ['status', 'progress', 'message']))

    await job.save()

    return job
  }

  async resetJob(_id, update) {
    const job = await Task.findOne({ _id })

    if (!job) return null

    job.set(_.pick(update, ['status', 'progress', 'message']))

    job.reset()
    await job.save()

    return job
  }

  async resetJobsFromPrinter(printerInfo, message) {
    const jobs = await Task.find({
      owner: printerInfo.name,
      queue: printerInfo.queue,
      status: { $in: [null, 'queued', 'running'] },
    })

    for (const job of jobs) {
      job.reset()
      await job.save()
    }

    if (jobs.length) {
      console.log(chalk.red(` ! ${jobs.length} Jobs finalizado por disconexão de impressora`), printerInfo.name)
    }
  }
}
