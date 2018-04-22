const path = require('path')
const http = require('http')
const chalk = require('chalk')
const mongodb = require('mongodb')
const express = require('express')
const mongoose = require('mongoose')
const SocketIO = require('socket.io')

// const Task = require('./Task')
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
  const server = http.Server(app)
  console.log( ' . socket.io')
  const io = SocketIO(server, {
    pingTimeout: 5000,
    pingInterval: 1000,
  })

  // Set custom promisse library to use
  console.log( ' . mongodb')
  mongoose.Promise = global.Promise
  await mongoose.connect('mongodb://localhost/vending3d')

  console.log( ' . lift server')
  await server.listen(PORT)

  console.log( ' . start pooling')
  startPoolServer(io)

  // let tasks = await Task.find({})
  // console.log(tasks)
}

// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html')
// });

let job = {}

setInterval(() => {
  job = job ? null : {
    _id: 'lol',
    status: 'queued', 
    file: path.join(__dirname, './README.md')
  }
}, 2000)

async function startPoolServer(io) {
  const pooler = new PoolServer('print')
  io.on('connection', (socket) => {
    startWorker(socket, pooler)
  })
}

async function startWorker(socket, pooler) {
  console.log(chalk.green(' + new connection'))
  let iam = null
  socket.on('iam', (data) => {
    iam = data
  })

  socket.on('pool', async () => {
    if (!iam) {
      console.error(' ! Cannot lock job without `iam` name')
      return socket.emit('job', null)
    }

    let job = await pooler.findJobAndLock(iam)

    if (job) {
      console.log(chalk.green(` # Job '${job._id}' Assigned to ${iam}`))
    }
    // console.log(chalk.yellow(' . debug message'))
    socket.emit('job', job)
  })

  /* 
   * Update job
   */
  socket.on('job', async (data) => {
    let job = await pooler.updateJob(data._id, data.payload)

    if (job) {
      console.log(chalk.green(` # Job '${data._id}' updated. status='${job.status}'`))
      if (job.status == 'failed' && job.message) {
        console.log(chalk.dim(' | ') + chalk.red(job.message))
      }
    }

    socket.emit('job:'+job._id, job)
  })
  
  socket.on('disconnect', () => {
    console.log(chalk.red(' - disconnect'))
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