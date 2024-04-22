/*
 * Database Model
 */
import { Schema, model } from 'mongoose'
import Axios from 'axios'
import { TaskFields } from './Fields'
import _ from 'lodash'

const Model = new Schema(
  {
    queue: String,

    active: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      default: 'queued',
      required: true,
    },

    webhook: {
      type: {
        url: {
          type: String,
          default: null,
        },

        pendingSince: {
          type: Date,
          default: null,
        },

        failedMessage: {
          type: String,
          default: null,
        },
      },
      default: null,
    },

    owner: {
      type: String,
    },

    queuedAt: {
      type: Date,
      default: Date.now,
    },

    lastFailedAt: {
      type: Date,
      default: null,
    },

    lastCanceledAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    pingAt: {
      type: Date,
      default: null,
    },

    progress: Number,
    message: String,
    refId: String,

    file: {
      type: String,
    },

    payload: Object,

    restarts: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
)

Model.pre('save', function () {
  if (!this.active && this.isModified('active')) {
    this.archivedAt = new Date()
    this.lockedAt = null
  }

  if (this.active && this.isModified('status')) {
    if (this.status == 'failed' && this.restarts < 3) {
      this.reset()
      console.log('auto restarting')
    }

    if (this.status == 'queued') {
      this.queuedAt = new Date()
      this.restarts = this.restarts + 1 || 2
    } else if (this.status == 'running') {
      this.startedAt = new Date()
    } else if (this.status == 'failed') {
      this.lastFailedAt = new Date()
    } else if (this.status == 'success') {
      this.completedAt = new Date()
    } else if (this.status == 'canceled') {
      this.lastCanceledAt = new Date()
    }

    if (['canceled', 'failed', 'queued'].includes(this.status)) {
      this.owner = null
      this.pingAt = null
      this.lockedAt = null
      this.progress = null
    }
  }

  // Flag it to send webhook
  if (this.webhook?.url) {
    if (this.isNew || this.isModified(['active', 'status'])) {
      this.webhook.pendingSince = new Date()
    }
  }
})

Model.post('save', async function postSave() {
  console.log('post save', this.webhook, this.webhook?.pendingSince)
  if (this.webhook?.pendingSince) {
    console.log('sending webhook')
    await this.constructor.sendWebhook(this)
  }
})

Model.static('sendWebhook', async function sendWebhook(model) {
  const payload = _.pick(model, TaskFields)
  try {
    await Axios({
      method: 'post',
      url: model.webhook.url,
      data: payload,
      timeout: 10000,
    })

    await this.findOneAndUpdate(
      {
        _id: model._id,
        'webhook.pendingSince': model.webhook.pendingSince,
      },
      {
        $set: { 'webhook.pendingSince': null, 'webhook.failedMessage': null },
      }
    )
  } catch (e) {
    await this.findOneAndUpdate(
      {
        _id: model._id,
        'webhook.pendingSince': model.webhook.pendingSince,
      },
      {
        $set: { 'webhook.failedMessage': e.message },
      }
    )
  }
})

Model.virtual('duration').get(function () {
  if (this.status != 'success') return null

  return this.startedAt && this.completedAt ? this.completedAt - this.startedAt : null
})

Model.virtual('name').get(function () {
  return this.file ? this.file.split('/').pop().replace(/\?.*/, '') : '[Unknown]'
})

Model.virtual('fileURL').get(function () {
  return `/tasks/${this.id}/file`
})

Model.virtual('taskURL').get(function () {
  return `/tasks/${this.id}`
})

Model.method('reset', function () {
  this.set({
    active: true,
    status: 'queued',
    owner: null,
    pingAt: null,
    lockedAt: null,
    progress: null,
  })
})

// Model.pre("save", () => {
//   this.running = ['queued', 'running'].includes(thhis.status)
// });

export default model('Task', Model)
