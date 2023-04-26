/*
 * Database Model
 */
import { Schema, model } from "mongoose";

var Model = new Schema(
  {
    queue: String,

    active: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      default: "queued",
      required: true,
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
);

Model.pre("save", function () {
  if (!this.active && this.isModified("active")) {
    this.archivedAt = Date.now();
    this.lockedAt = null;
  }

  if (this.active && this.isModified("status")) {
    if (this.status == "failed" && this.restarts < 3) {
      this.reset();
      console.log("auto restarting");
    }

    if (this.status == "queued") {
      this.queuedAt = Date.now();
      this.restarts = this.restarts + 1 || 2;
    } else if (this.status == "running") {
      this.startedAt = Date.now();
    } else if (this.status == "failed") {
      this.lastFailedAt = Date.now();
    } else if (this.status == "success") {
      this.completedAt = Date.now();
    } else if (this.status == "canceled") {
      this.lastCanceledAt = Date.now();
    }

    if (["canceled", "failed", "queued"].includes(this.status)) {
      this.owner = null;
      this.pingAt = null;
      this.lockedAt = null;
      this.progress = null;
    }
  }

  if (this.active && this.$isModified("status")) {
  }
});

Model.virtual("duration").get(function () {
  if (this.status != "success") return null;

  return this.startedAt && this.completedAt
    ? this.completedAt - this.startedAt
    : null;
});

Model.virtual("fileURL").get(function () {
  return `/tasks/${this.id}/file`;
});

Model.virtual("taskURL").get(function () {
  return `/tasks/${this.id}`;
});

Model.method("reset", function () {
  this.set({
    active: true,
    status: "queued",
    owner: null,
    pingAt: null,
    lockedAt: null,
    progress: null,
  });
});

// Model.pre("save", () => {
//   this.running = ['queued', 'running'].includes(thhis.status)
// });

export default model("Task", Model);
