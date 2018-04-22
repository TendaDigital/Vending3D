const _ = require('lodash')
const chalk = require('chalk')
const Readline = require('serialport').parsers.Readline
const SerialPort = require('serialport')
const EventEmitter = require('events')

const Defered = require('./Defered')

module.exports = class MarlinServer extends EventEmitter{
  constructor(options) {
    super()

    this.options = options || {}
    
    this.promiseQueue = []

    // Ready promise indicating reception of `start` string
    this._ready = new Defered()
  }

  get name() {
    return this.port ? this.port.path : 'DISCONNECTED'
  }

  async connect(serialPort) {
    // Defaults to options.port
    serialPort = serialPort || this.options.port || null

    // Is it connecting/connected? Return last promise
    if (this._connect) {
      return await this._connect
    }

    // Must have a serialPort to seek
    if (!serialPort) {
      throw new Error('No serial port name or pattern provided')
    }

    // If serialPort is a string, use it as a object {comName: String}
    if (_.isString(serialPort))
      serialPort = {comName: serialPort}
    else
      serialPort = serialPort

    // Try to find port
    let portList = await SerialPort.list()
    let portProp = _.find(portList, serialPort)

    // If port was not found, reject promise
    if (!portProp) {
      throw new Error('Port not found: ' + JSON.stringify(serialPort))
    }
    
    // Create a new re-usable Promise that will wait for connection
    this._connect = new Promise(async (resolve, reject) => {
      try {
        // Open Serial Port
        this.port = new SerialPort(portProp.comName, { baudRate: 115200 })

        // Bufferize Line and use as dataReceived
        let lineBuffer = new Readline({ delimiter: '\n' })

        // Proxy all data received by serial port to the line Buffer
        this.port.pipe(lineBuffer)
        // this.port.on('data', (data) =>{
        //   data = data.toString()
        //   console.log('( ', data.replace(/\n/g, chalk.yellow('\\n')).replace(/\r/g, chalk.yellow('\\r')))
        // })

        // Once there is data in the line Buffer, delegate to dataReceived
        lineBuffer.on('data', (data) => this.dataReceived(data))
        // Every time it opens/closes, reset the current queue
        this.port.on('open', () => this.resetQueue())
        this.port.on('close', () => this.resetQueue())
        this.port.on('error', (err) => {
          reject(err)
        })
        resolve()
      } catch (e) {
        reject(e)
      }
    })

    await this._connect
  } 

  ready() {
    return this._ready.promise
  }

  resetQueue() {
    let promise
    while(promise = this.promiseQueue.shift())
      promise.reject('Connection opening')
    // this.promiseQueue = []
  }

  dataReceived(data) {
    // Skip empty data packets
    if (!data)
      return

    // Debug to console if debug flag is set
    if (this.options.debug) {
      // console.log('<', new Buffer(data))
      console.log('<', data)
    }

    // Make sure it's a string
    data = data.toString()

    // Emit data
    this.emit('data', data)

    // Check for start packet
    if (data.startsWith('start')) {
      this.resetQueue()
      return this._ready.resolve()
    }

    // Only packets starting with `:` are responses
    if (!data.startsWith('ok')) {
      return
    }
    let promise = this.promiseQueue.shift()
  
    if (!promise)
      return

    promise.resolve(data)
  }

  execute(command) {
    if (this.options.debug)
      console.log('>', command)

    // Combine with nl and cr
    command += '\n'

    // Write to serial port
    // console.log(') ', command.replace(/\n/g, chalk.yellow('\\n')).replace(/\r/g, chalk.yellow('\\r')))
    this.port.write(command)

    // Return a new promise and pushes it to the queue
    let promise = new Promise((resolve, reject) => {
      this.promiseQueue.push({resolve, reject})
    })

    return promise
  }
}