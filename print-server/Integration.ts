/*
 * Database Model
 */
import { Schema, model } from 'mongoose'

const Model = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    queue: String,
    type: String,

    lastSyncAt: {
      type: Date,
    },

    cursor: {
      type: Object,
    },
  },
  { timestamps: true }
)

export default model('Integration', Model)
