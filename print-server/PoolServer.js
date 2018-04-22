const _ = require('lodash')
const Task = require('./Task')

module.exports = class PoolServer {
  constructor(namespace) {
    this.namespace = namespace
  }

  async findJobAndLock(owner) {
    if (!owner) throw new Error('Cannot lock without `owner`');

    let doc = await Task.findOneAndUpdate({
      namespace: this.namespace,
      lockedAt: null,
      status: 'queued',
    }, {
      $set:{
        owner,
        lockedAt: new Date(),
      }
    }, {new: true});

    return doc
  }

  async updateJob(_id, update) {
    let job = await Task.findOne({_id})

    if (!job) return null;

    job.set(_.pick(update, ['status', 'progress', 'message']))

    await job.save()

    return job
  }
}