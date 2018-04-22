const _ = require('lodash')
const path = require('path')
const http = require('http')
const chalk = require('chalk')
const mongodb = require('mongodb')
const express = require('express')
const mongoose = require('mongoose')
const SocketIO = require('socket.io')

const Task = require('./Task')
const Printer = require('./Printer')

const PoolServer = require('./PoolServer')

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
  startRESTServer(app)

  console.log( ' . lift server')
  await server.listen(PORT)
  // let tasks = await Task.find({})
  // console.log(tasks)
}

// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html')
// });

function startRESTServer(app) {
  const TaskFields = [
    'namespace',
    'status',
    'owner',
    'lockedAt',
    'pingAt',
    'progress',
    'message',
    'payload'
  ]

  const PrinterFields = [
    'name',
    'status',
    'active',
    'pingAt'
  ]

  app.get('/tasks', async (req, res, next) => {
    console.log('tasks')
    let tasks = await Task
        .find({ active: true })
        .sort({ createdAt: -1 })
        .limit(100)
  
    res.send(tasks.map(p => _.pick(p, TaskFields)))
  })

  app.get('/printers', async (req, res, next) => {
    let printers = await Printer
        .find({})
        .sort({ createdAt: 1 })

    res.send(printers.map(p => _.pick(p, PrinterFields)))
  })

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
  await Printer.ping(iam, true)

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

    Printer.ping(iam, true)

    // console.log(chalk.yellow(' . debug message'))
    socket.emit('job', job)
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

    Printer.ping(iam, true)

    socket.emit('job:'+job._id, job)
  })
  
  socket.on('disconnect', async () => {
    if (currentJob && currentJob.status == 'running') {
      await pooler.updateJob(currentJob._id, {status: 'failed', message: 'Impressora desconectou'})
      console.log(chalk.red(' ! Job finalizado por disconexão de impressora: ' + currentJob._id), iam)
    }

    console.log(chalk.red(' - disconnect'), iam)
    Printer.ping(iam, false)
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