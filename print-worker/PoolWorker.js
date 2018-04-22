const io = require('socket.io-client')

module.exports = class SocketConnection {
  constructor(iam, opts = {}) {
    this.iam = iam
    this.socket = io(opts.url, opts)

    this.socket.on('connect', () => {
      this.socket.emit('iam', iam)
    })
  }

  connect() {
    if (!this._connect) {
      this._connect = new Promise((resolve, reject) => {
        this.socket.once('error', reject)
        this.socket.once('connect', resolve)
      })
    }

    return this._connect
  }

  pool() {
    let resolved = false
    return new Promise((resolve, reject) => {
      this.socket.once('job', (data) => {
        if (resolved) return;

        if (!data) return resolve(null);

        resolve(new Job(this.socket, data))
      })

      setTimeout(() => {
        if (resolved) return;

        resolved = true
        resolve(null)
      }, 100)

      this.socket.emit('pool')
    })
  }
}

class Job {
  constructor(socket, data) {
    if (!data) throw new Error('No job data set');
    if (!data._id) throw new Error('No _id set on job');
    if (!data.status) throw new Error('No status set on job');

    this.socket = socket
    this.data = Object.assign({
      _id: null,
      status: '',
      message: '',
      progress: -1,
      payload: {},
    }, data)

    this.stopped = false

    this._id = data._id
    this.topic= 'job:'+this._id

    this.socket.on(this.topic, (data) => this.handleEvent(data))
  }

  handleEvent(data) {
    // console.log('handleEvent', data)

    // Skip if not the job itself
    if (!data || data._id != this._id) return;


    if (['stopped', 'failed' ,'complete'].includes(data.status)) {
      // Turn off events and set stopped flag
      this.socket.off(this.topic)
      this.stopped = true
    }

    Object.assign(this.data, data)
  }

  update(payload) {
    // Object.assign(this.data, payload)
    this.socket.emit('job', {_id: this._id, payload})
  }

  setStatus(status, message) {
    this.update({status, message})
  }

  setProgress(progress) {
    this.update({progress})
  }
}