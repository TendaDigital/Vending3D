import chalk from 'chalk'

import _ from 'lodash'
import fs, { readFileSync } from 'fs'
import path from 'path'
import cors from 'cors'
import http from 'http'
import express from 'express'
import mongoose from 'mongoose'

import Task from './Task.js'
import Printer from './Printer.js'
import Integration from './Integration.js'
import PoolServer from './PoolServer.js'
import { readObjectStore } from './ObjectStore.js'
import { Server } from 'socket.io'
import { Socket } from 'socket.io'

const PORT = process.env.PORT || 9077

async function main() {
  console.log()
  console.log(' # Configuration')
  console.log(' # http://localhost:' + PORT)
  console.log()
  console.log(' # Startup...')

  console.log(' . express')
  const app = express()

  console.log(' . http server')
  const server = http.createServer(app)

  console.log(' . socket.io')
  const io = new Server(server, {
    pingTimeout: 5000,
    pingInterval: 1000,
  })

  // io.use((socket, next) => {

  // Set custom promisse library to use
  console.log(' . mongodb')
  mongoose.Promise = global.Promise
  await mongoose.connect('mongodb://localhost/vending3d')

  console.log(' . start pooling')
  startPoolServer(io)

  console.log(' . start REST server')
  await startRESTServer(app)

  console.log(' . start Integration deamons')
  await startIntegrationDeamons(app)

  console.log(chalk.green(' . lifted server'))
  await server.listen(PORT)
  // let tasks = await Task.find({})
  // console.log(tasks)
}

import { TaskFields, PrinterFields } from './Fields.js'
import IntegrationDeamon from './IntegrationDeamon.js'

async function startRESTServer(app) {
  app.use(cors())

  app.get('/', function (req, res) {
    // Respond with the list of routes in format of { routes: [{method: 'GET', path: '/some/route'}, ...] }
    res.send(
      _.map(app.router.stack, (r) => {
        if (r.route && r.route.path) {
          return { [r.route.stack[0].method.toUpperCase()]: `${r.route.path}` }
        }
      }).filter((r) => r)
    )
  })

  app.get('/tasks', async (req, res) => {
    const queue = req.query.queue || undefined

    const query: any = { active: true }
    if (queue) {
      query.queue = queue
    }
    const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(200)
    // let count = await Task.count(query);

    res.send(tasks.map((p) => _.pick(p, TaskFields)))
  })

  app.get('/tasks/pending', async (req, res) => {
    const query: any = { active: true, status: { $nin: ['success'] } }

    const queue = req.query.queue || undefined
    if (queue) {
      query.queue = queue
    }
    const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(200)
    const count = await Task.count(query)

    res.send({ count, data: tasks.map((p) => _.pick(p, TaskFields)) })
  })

  app.get('/tasks/archive', async (req, res) => {
    // Set active flag to false for tasks older than 1 day
    const query = {
      $or: [
        {
          active: true,
          updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: ['success', 'canceled', 'failed'],
        },
        {
          active: true,
          updatedAt: { $lt: new Date(Date.now() - 1 * 60 * 1000) },
          status: ['success', 'canceled'],
        },
        {
          active: true,
          completedAt: { $lt: new Date(Date.now() - 1 * 60 * 1000) },
          status: ['queued'],
        },
      ],
    }
    const tasks = await Task.updateMany(query, {
      active: false,
      lockedAt: null,
      archivedAt: Date.now(),
    })

    res.send(tasks)
  })

  app.get('/tasks/create', async (req, res) => {
    let file = req.query.file
    const queue = req.query.queue
    const webhook = req.query.webhook

    if (!file) {
      return res.status(400).send('file not specified in query')
    }
    if (!queue) {
      return res.status(400).send('queue not specified in query')
    }

    console.log('new print', file)

    // If no slashess in file, assume it's a local file
    if (file.indexOf('/') === -1) {
      if (!file.includes('.')) {
        file = file + '.gcode'
      }
      if (!fs.existsSync(path.join(`../objects`, file))) {
        return res.status(404).send(`Arquivo não encontrado: ${file} na pasta /objects`)
      }
    }

    const payload = {
      // name,
      // description: req.query.description,
    }

    const task = await Task.create({
      payload,
      queue,
      file,
      webhook: webhook
        ? {
            url: webhook,
          }
        : null,
      refId: req.query.refId ?? null,
    })

    res.send(_.pick(task, TaskFields))
  })

  app.get('/tasks/:taskId', async (req, res) => {
    const taskId = req.params.taskId
    console.log('tasks')

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    res.send(_.pick(task, TaskFields))
  })

  app.get('/tasks/:taskId/file', async (req, res) => {
    const taskId = req.params.taskId

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    if (!task.fileURL) {
      return res.status(404).send('Task não possui arquivo: ' + taskId)
    }

    // If is extenal file, redirect
    if (task.fileURL.startsWith('http')) {
      return res.redirect(task.fileURL)
    }

    if (task.fileURL.startsWith('data:')) {
      return task.fileURL.replace(/^data:/, '')
    }

    // Return to static asset if exists
    const objectFile = path.join(`../objects`, task.file)
    if (fs.existsSync(objectFile)) {
      // Get absolute path to file
      const absolutePath = path.resolve(objectFile)
      return res.sendFile(absolutePath)
    }

    // Check if file is an external URL
    if (task.file.startsWith('http')) {
      return res.redirect(task.file)
    }

    // Return 404 if file not found
    return res.status(404).send('Arquivo não encontrado: ' + task.file)
  })

  // Serve static files at /objects
  app.use('/objects', express.static('../objects'))

  app.get('/tasks/:taskId/repeat', async (req, res) => {
    const taskId = req.params.taskId
    console.log('repeat print', taskId)

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    const BlockRestartStatuses = ['queued', 'running']
    if (BlockRestartStatuses.includes(task.status)) {
      return res.status(400).send(`Não pode reiniciar task com status '${task.status}'`)
    }

    // Reset task back to queue
    task.reset()

    // Save task
    await task.save()

    res.send(_.pick(task, TaskFields))
  })

  app.get('/tasks/:taskId/archive', async (req, res) => {
    const taskId = req.params.taskId
    console.log('archive print', taskId)

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    const BlockRestartStatuses = ['queued', 'running']
    if (BlockRestartStatuses.includes(task.status)) {
      return res.status(400).send(`Não pode arquivar task com status '${task.status}'`)
    }

    task.active = false
    await task.save()

    res.send(_.pick(task, TaskFields))
  })

  app.get('/tasks/:taskId/cancel', async (req, res) => {
    const taskId = req.params.taskId
    console.log('archive print', taskId)

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    const AllowedStatuses = ['queued', 'running', 'failed']
    if (!AllowedStatuses.includes(task.status)) {
      return res.status(400).send(`Não pode cancelar task com status '${task.status}'`)
    }

    task.status = 'canceled'
    task.lockedAt = null
    await task.save()

    res.send(_.pick(task, TaskFields))
  })

  app.get('/printers', async (req, res) => {
    const queue = req.query.queue ?? undefined
    const query: any = { active: true }

    if (queue) {
      query.queue = queue
    }

    let printers = await Printer.find(query)
      .sort({ name: 1 })
      .populate({
        path: 'task',
        match: {
          status: 'running',
        },
      })

    // Sort printers acordingly
    const weights = ['', 'printing', 'idle', 'waiting', 'disconnected']
    printers = _.sortBy(printers, (p) => weights.indexOf(p.status) || 10)

    printers = printers.map((p) => _.pick(p, PrinterFields))
    printers.forEach((p) => (p.task = p.task ? _.pick(p.task, TaskFields) : null))

    res.send(printers)
  })

  app.get('/printers/:id', async (req, res) => {
    const id = req.params.id

    const printer = await Printer.findById(id).populate({
      path: 'task',
      match: {
        status: 'running',
      },
    })

    res.send(_.pick(printer, PrinterFields))
  })

  app.get('/printers/:printerId/archive', async (req, res) => {
    const printerId = req.params.printerId

    const printer = await Printer.findById(printerId)

    if (!printer) {
      return res.status(404).send('Impressora não encontrada: ' + printerId)
    }

    if (printer.status !== 'disconnected') {
      return res.status(400).send('Impressora só pode ser removida após ser desconectada')
    }

    printer.active = false
    await printer.save()

    res.send()
  })

  /*
   * Objects api
   */
  const objectsPath = '../objects'
  app.get('/objects', async (req, res) => {
    const objects = await readObjectStore(objectsPath)

    res.send(objects)
  })

  app.use(
    '/objects/files',
    express.static(objectsPath, {
      index: false,
      extensions: ['gcode', 'stl', 'jpg', 'png', 'jpeg', 'txt'],
      // setHeaders: () => {},
    })
  )

  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send({ error: 'Something broke: ' + err.stack })
  })
}

function startPoolServer(io: Server) {
  const pooler = new PoolServer()
  io.on('connection', async (socket) => {
    await startWorker(socket, pooler)
  })
}

async function startIntegrationDeamons() {
  const config = JSON.parse(readFileSync('../config.json').toString('utf-8'))

  for (const integration of config.integrations) {
    console.log(' . ', '+', integration.name)
    const deamon = await IntegrationDeamon.build(integration)
    deamon.start().catch((e) => {
      console.error(' ! IntegrationDeamon crashed', integration.name, e)
      process.exit(1)
    })
  }
}

async function startWorker(socket: Socket, pooler) {
  const query = socket.handshake.query
  const printerInfo = {
    name: query.name,
    queue: query.queue,
  }
  // let iam = socket.handshake.query.printer;
  // let queue = socket.handshake.query.queue;
  let currentJob = null

  try {
    await pooler.register(printerInfo)
    await socket.emit('register')
  } catch (e) {
    await socket.emit('error', e.message)
    await socket.disconnect(true)
    console.log(chalk.red(' ! connection closed: ' + e.message), printerInfo.name ?? '')
    return
  }

  console.log(chalk.green(' + registered printer'), printerInfo.name, `[${chalk.bold(printerInfo.queue)}]`)
  await Printer.ping(printerInfo.name)

  socket.on('pool', async () => {
    // if (!iam) {
    //   console.error(" ! Cannot lock job without `iam` name");
    //   return;
    // }

    const job = await pooler.findJobAndLock(printerInfo)

    if (job) {
      console.log(chalk.green(` # Job '${job.id}' Assigned to ${printerInfo.name}`))
      currentJob = job
    }

    Printer.ping(printerInfo.name)

    // console.log(chalk.yellow(' . debug message'))
    socket.emit('job', job ? _.pick(job, TaskFields) : null)
  })

  socket.on('printerStatus', async (data) => {
    // console.log('printerStatus', status)
    const printer = await Printer.findOrCreate(printerInfo.name)
    printer.ping(data.status)
    printer.set({ state: data.payload || {} })
    await printer.save()
  })

  /*
   * Update job
   */
  socket.on('job', async (data) => {
    const job = await pooler.updateJob(data.id, data.payload)

    // Update job if they are the same
    if (currentJob && job && job.id == currentJob.id) {
      currentJob = job
    }

    if (job) {
      console.log(chalk.green(` # Job '${data.id}' status='${job.status}' ${JSON.stringify(data)}`))
      if (job.status == 'failed' && job.message) {
        console.log(chalk.dim(' | ') + chalk.red(job.message))
      }
    }

    Printer.ping(printerInfo.name)

    socket.emit('job:' + job.id, job)
  })

  socket.on('disconnect', async () => {
    console.log(chalk.red(' - unregister printer'), printerInfo.name)
    // await Printer.disconnected(printerInfo.name);
    await pooler.unregister(printerInfo)
  })
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
