const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const http = require('http')
const Axios = require('axios')
const chalk = require('chalk')
const mongodb = require('mongodb')
const express = require('express')
const mongoose = require('mongoose')
const SocketIO = require('socket.io')

const Task = require('./Task')
const Printer = require('./Printer')
const PoolServer = require('./PoolServer')
const ObjectStore = require('./ObjectStore')
const { default: axios } = require('axios')

const PORT = process.PORT || 9077

async function main() {
  console.log()
  console.log(' # Configuration')
  console.log(' # PORT:', PORT)
  console.log()
  console.log(' # Startup...')

  console.log( ' . express')
  const app = express()

  console.log( ' . http server')
  const server = http.createServer(app)

  console.log( ' . socket.io')
  const io = SocketIO(server, {
    pingTimeout: 5000,
    pingInterval: 1000,
  })

  // Set custom promisse library to use
  console.log( ' . mongodb')
  mongoose.Promise = global.Promise
  await mongoose.connect('mongodb://localhost/vending3d')

  console.log( ' . start pooling')
  startPoolServer(io)

  console.log(' . start REST server')
  await startRESTServer(app)

  console.log( ' . lift server')
  await server.listen(PORT)
  // let tasks = await Task.find({})
  // console.log(tasks)
}

// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html')
// });

async function startRESTServer(app) {
  const TaskFields = [
    'id',
    'namespace',
    'status',
    'owner',
    'pingAt',
    'lockedAt',
    'startedAt',
    'completedAt',
    'duration',
    'progress',
    'restarts',
    'message',
    'payload',
  ]

  const PrinterFields = [
    'id',
    'name',
    'status',
    'active',
    'message',
    'pingAt',
    'state',
    'task',
  ]

  app.use(cors())
  app.use(express.json())

  app.get('/task/owner-info/:id', async (req, res, next) => {
    const { id } = req.params
    let response;
    try {
      response = await axios.get(`https://api.typeform.com/forms/${process.env.TYPEFORM_FORMID}/responses?fields=wdrwqBopYwsy&included_response_ids=${id}`,
      {
        headers: {
          Authorization: process.env.TYPEFORM_TOKEN
        }
      })
    } catch (error) {
      console.log(error)
    }
    res.send(response.data.total_items > 0 ? response.data.items[0] : {})
  })

  app.get('/tasks', async (req, res, next) => {
    let tasks = await Task
        .find({ active: true })
        .sort({ createdAt: -1 })
        .limit(200)

    res.send(tasks.map(p => _.pick(p, TaskFields)))
  })

  app.get('/tasks/:taskId', async (req, res, next) => {
    let taskId = req.params.taskId
    console.log('tasks')

    let task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    res.send(_.pick(task, TaskFields))
  })

  app.post('/tasks/print/:file', async (req, res, next) => {
    let file = req.params.file
    let userInfo = req.body
    console.log('new print', file)

    let payload = {
      file: path.join(__dirname, `../objects/${file}.gcode`),
      name: file,
      description: req.query.description,
      ...userInfo
    }

    let task = await Task.create({
      namespace: 'print',
      payload,
    })

    res.send(_.pick(task, TaskFields))
  })

  app.get('/tasks/:taskId/repeat', async (req, res, next) => {
    let taskId = req.params.taskId
    console.log('repeat print', taskId)

    let task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    let BlockRestartStatuses = ['queued', 'running']
    if (BlockRestartStatuses.includes(task.status)) {
      return res.status(400).send(`Não pode reiniciar task com status '${task.status}'`)
    }

    // Reset task back to queue
    task.reset()

    // Save task
    await task.save()

    res.send(_.pick(task, TaskFields))
  })

  app.get('/tasks/:taskId/archive', async (req, res, next) => {
    let taskId = req.params.taskId
    console.log('archive print', taskId)

    let task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    let BlockRestartStatuses = ['queued', 'running']
    if (BlockRestartStatuses.includes(task.status)) {
      return res.status(400).send(`Não pode arquivar task com status '${task.status}'`)
    }

    task.active = false
    await task.save()

    res.send(_.pick(task, TaskFields))
  })

  app.get('/tasks/:taskId/cancel', async (req, res, next) => {
    let taskId = req.params.taskId
    console.log('archive print', taskId)

    let task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).send('Task não encontrada: ' + taskId)
    }

    let AllowedStatuses = ['queued', 'running']
    if (!AllowedStatuses.includes(task.status)) {
      return res.status(400).send(`Não pode cancelar task com status '${task.status}'`)
    }

    task.status = 'canceled'
    await task.save()

    res.send(_.pick(task, TaskFields))
  })


  app.get('/printers', async (req, res, next) => {
    let printers = await Printer
        .find({})
        .sort({ name: 1 })
        .populate({
          path: 'task',
          match: {
            status: 'running',
          }
        })

    // Sort printers acordingly
    let weights = ['', 'printing', 'idle', 'waiting', 'disconnected']
    printers = _.sortBy(printers, (p) => weights.indexOf(p.status) || 10)

    printers = printers.map(p => _.pick(p, PrinterFields))
    printers.forEach(p => p.task = p.task ? _.pick(p.task, TaskFields) : null)

    res.send(printers)
  })

  app.get('/printers/:printerId/remove', async (req, res, next) => {
    let printerId = req.params.printerId

    let printer = await Printer.findById(printerId)

    if (!printer) {
      return res.status(404).send('Impressora não encontrada: ' + printerId)
    }

    await printer.remove()

    res.send()
  })

  /*
   * Objects api
   */
  let objectsPath = path.join(__dirname, '../objects')
  app.get('/objects', async (req, res, next) => {
    let objects = await ObjectStore.read(objectsPath)

    res.send(objects)
  })

  app.use('/objects/files', express.static(objectsPath, {
    index: false,
    extensions: ['gcode', 'stl', 'jpg', 'png', 'jpeg', 'txt'],
    setHeaders: () => {},
  }))

  await ObjectStore.generateThumbnails(objectsPath)
}

function startPoolServer(io) {
  const pooler = new PoolServer('print')
  io.on('connection', (socket) => {
    startWorker(socket, pooler)
  })
}

async function startWorker(socket, pooler) {
  let iam = socket.handshake.query.printer
  let currentJob = null

  if (!iam) {
    socket.close('no printer name provider')
    console.log(chalk.red(' ! connection closed because no printer information providerd'), iam)
    return
  }

  console.log(chalk.green(' + connection'), iam)
  await Printer.ping(iam)

  socket.on('pool', async () => {
    if (!iam) {
      console.error(' ! Cannot lock job without `iam` name')
      return
    }

    let job = await pooler.findJobAndLock(iam)

    if (job) {
      console.log(chalk.green(` # Job '${job._id}' Assigned to ${iam}`))
      currentJob = job
    }

    Printer.ping(iam)

    // console.log(chalk.yellow(' . debug message'))
    socket.emit('job', job)
  })

  socket.on('printerStatus', async (data) => {
    // console.log('printerStatus', status)
    let printer = await Printer.findOrCreate(iam)
    printer.ping(data.status)
    printer.set({state: data.payload || {}})
    await printer.save()
  })

  /*
   * Update job
   */
  socket.on('job', async (data) => {
    let job = await pooler.updateJob(data._id, data.payload)

    // Update job if they are the same
    if (currentJob && job && job.id == currentJob.id) {
      currentJob = job
    }

    if (job) {
      console.log(chalk.green(` # Job '${data._id}' status='${job.status}' ${JSON.stringify(data)}`))
      if (job.status == 'failed' && job.message) {
        console.log(chalk.dim(' | ') + chalk.red(job.message))
      }
    }

    Printer.ping(iam)

    socket.emit('job:'+job._id, job)
  })

  socket.on('disconnect', async () => {
    if (currentJob && currentJob.status == 'running') {
      await pooler.updateJob(currentJob._id, {status: 'failed', message: 'Impressora desconectou'})
      console.log(chalk.red(' ! Job finalizado por disconexão de impressora: ' + currentJob._id), iam)
    }

    console.log(chalk.red(' - disconnect'), iam)
    await Printer.disconnected(iam)
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
