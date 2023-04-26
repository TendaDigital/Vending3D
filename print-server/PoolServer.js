import _ from "lodash";
import Task from "./Task.js";

export default class PoolServer {
  async findJobAndLock(printerInfo) {
    if (!printerInfo) throw new Error("Cannot lock without 'printerInfo'");
    if (!printerInfo.name) throw new Error("Cannot lock without 'name'");
    if (!printerInfo.queue) throw new Error("Cannot lock without 'queue'");

    let doc = await Task.findOneAndUpdate(
      {
        $or: [
          {
            queue: printerInfo.queue,
            lockedAt: null,
            status: "queued",
          },
          {
            queue: printerInfo.queue,
            lastPingAt: { $lt: new Date(Date.now() - 1000 * 60 * 10) },
            status: "queued",
          },
        ],
      },
      {
        $set: {
          owner: printerInfo.name,
          lockedAt: new Date(),
        },
      },
      { new: true, sort: { createdAt: 1 } }
    );

    return doc;
  }

  async updateJob(_id, update) {
    let job = await Task.findOne({ _id });

    if (!job) return null;

    job.set(_.pick(update, ["status", "progress", "message"]));

    await job.save();

    return job;
  }

  async resetJob(_id, update) {
    let job = await Task.findOne({ _id });

    if (!job) return null;

    job.set(_.pick(update, ["status", "progress", "message"]));

    job.reset();
    await job.save();

    return job;
  }
}
