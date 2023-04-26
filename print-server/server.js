import chalk from "chalk";

import _ from "lodash";
import fs from "fs";
import path from "path";
import cors from "cors";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import SocketIO from "socket.io";

import Task from "./Task.js";
import Printer from "./Printer.js";
import PoolServer from "./PoolServer.js";
import ObjectStore from "./ObjectStore.js";

const PORT = process.PORT || 9077;

async function main() {
  console.log();
  console.log(" # Configuration");
  console.log(" # PORT:", PORT);
  console.log();
  console.log(" # Startup...");

  console.log(" . express");
  const app = express();

  console.log(" . http server");
  const server = http.createServer(app);

  console.log(" . socket.io");
  const io = SocketIO(server, {
    pingTimeout: 5000,
    pingInterval: 1000,
  });

  // Set custom promisse library to use
  console.log(" . mongodb");
  mongoose.Promise = global.Promise;
  await mongoose.connect("mongodb://localhost/vending3d");

  console.log(" . start pooling");
  startPoolServer(io);

  console.log(" . start REST server");
  await startRESTServer(app);

  console.log(" . lift server");
  await server.listen(PORT);
  // let tasks = await Task.find({})
  // console.log(tasks)
}

async function startRESTServer(app) {
  const TaskFields = [
    "id",
    "active",
    "file",
    "queue",
    "status",
    "owner",
    "pingAt",
    "lockedAt",
    "startedAt",
    "createdAt",
    "completedAt",
    "archivedAt",
    "duration",
    "progress",
    "restarts",
    "message",
    "payload",
    "fileURL",
    "taskURL",
  ];

  const PrinterFields = [
    "id",
    "name",
    "status",
    "active",
    "message",
    "pingAt",
    "state",
    "task",
  ];

  app.use(cors());

  app.get("/", function (req, res) {
    // Respond with the list of routes in format of { routes: [{method: 'GET', path: '/some/route'}, ...] }
    res.send(
      _.map(app.router.stack, (r) => {
        if (r.route && r.route.path) {
          return { [r.route.stack[0].method.toUpperCase()]: `${r.route.path}` };
        }
      }).filter((r) => r)
    );
  });

  app.get("/tasks", async (req, res) => {
    const query = { active: true };
    let tasks = await Task.find(query).sort({ createdAt: -1 }).limit(200);
    // let count = await Task.count(query);

    res.send(tasks.map((p) => _.pick(p, TaskFields)));
  });

  app.get("/tasks/pending", async (req, res) => {
    const query = { active: true, status: { $ne: ["success"] } };
    let tasks = await Task.find(query).sort({ createdAt: -1 }).limit(200);
    let count = await Task.count(query);

    res.send({ count, data: tasks.map((p) => _.pick(p, TaskFields)) });
  });

  app.get("/tasks/archive", async (req, res) => {
    // Set active flag to false for tasks older than 1 day
    const query = {
      $or: [
        {
          active: true,
          updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: ["success", "canceled", "failed"],
        },
        {
          active: true,
          updatedAt: { $lt: new Date(Date.now() - 1 * 60 * 1000) },
          status: ["success", "canceled"],
        },
      ],
    };
    let tasks = await Task.updateMany(query, {
      active: false,
      lockedAt: null,
      archivedAt: Date.now(),
    });

    res.send(tasks);
  });

  app.get("/tasks/create", async (req, res) => {
    let file = req.query.file;
    let queue = req.query.queue;

    if (!file) {
      return res.status(400).send("file not specified in query");
    }
    if (!queue) {
      return res.status(400).send("queue not specified in query");
    }

    console.log("new print", file);

    // If no slashess in file, assume it's a local file
    if (file.indexOf("/") === -1) {
      if (!file.includes(".")) {
        file = file + ".gcode";
      }
      if (!fs.existsSync(path.join(`../objects`, file))) {
        return res
          .status(404)
          .send(`Arquivo não encontrado: ${file} na pasta /objects`);
      }
    }

    let payload = {
      // name,
      // description: req.query.description,
    };

    let task = await Task.create({
      payload,
      queue,
      file,
      refId: req.query.refId ?? null,
    });

    res.send(_.pick(task, TaskFields));
  });

  app.get("/tasks/:taskId", async (req, res) => {
    let taskId = req.params.taskId;
    console.log("tasks");

    let task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send("Task não encontrada: " + taskId);
    }

    res.send(_.pick(task, TaskFields));
  });

  app.get("/tasks/:taskId/file", async (req, res) => {
    let taskId = req.params.taskId;

    let task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send("Task não encontrada: " + taskId);
    }

    if (!task.fileURL) {
      return res.status(404).send("Task não possui arquivo: " + taskId);
    }

    // If is extenal file, redirect
    if (task.fileURL.startsWith("http")) {
      return res.redirect(task.fileURL);
    }

    // Return to static asset if exists
    const objectFile = path.join(`../objects`, task.file);
    if (fs.existsSync(objectFile)) {
      // Get absolute path to file
      let absolutePath = path.resolve(objectFile);
      return res.sendFile(absolutePath);
    }

    res.send("aaaaaaaaaaaaaaaa");
  });

  // Serve static files at /objects
  app.use("/objects", express.static("../objects"));

  app.get("/tasks/:taskId/repeat", async (req, res) => {
    let taskId = req.params.taskId;
    console.log("repeat print", taskId);

    let task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send("Task não encontrada: " + taskId);
    }

    let BlockRestartStatuses = ["queued", "running"];
    if (BlockRestartStatuses.includes(task.status)) {
      return res
        .status(400)
        .send(`Não pode reiniciar task com status '${task.status}'`);
    }

    // Reset task back to queue
    task.reset();

    // Save task
    await task.save();

    res.send(_.pick(task, TaskFields));
  });

  app.get("/tasks/:taskId/archive", async (req, res) => {
    let taskId = req.params.taskId;
    console.log("archive print", taskId);

    let task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send("Task não encontrada: " + taskId);
    }

    let BlockRestartStatuses = ["queued", "running"];
    if (BlockRestartStatuses.includes(task.status)) {
      return res
        .status(400)
        .send(`Não pode arquivar task com status '${task.status}'`);
    }

    task.active = false;
    await task.save();

    res.send(_.pick(task, TaskFields));
  });

  app.get("/tasks/:taskId/cancel", async (req, res) => {
    let taskId = req.params.taskId;
    console.log("archive print", taskId);

    let task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send("Task não encontrada: " + taskId);
    }

    let AllowedStatuses = ["queued", "running", "failed"];
    if (!AllowedStatuses.includes(task.status)) {
      return res
        .status(400)
        .send(`Não pode cancelar task com status '${task.status}'`);
    }

    task.status = "canceled";
    task.lockedAt = null;
    await task.save();

    res.send(_.pick(task, TaskFields));
  });

  app.get("/printers", async (req, res) => {
    let printers = await Printer.find({})
      .sort({ name: 1 })
      .populate({
        path: "task",
        match: {
          status: "running",
        },
      });

    // Sort printers acordingly
    let weights = ["", "printing", "idle", "waiting", "disconnected"];
    printers = _.sortBy(printers, (p) => weights.indexOf(p.status) || 10);

    printers = printers.map((p) => _.pick(p, PrinterFields));
    printers.forEach(
      (p) => (p.task = p.task ? _.pick(p.task, TaskFields) : null)
    );

    res.send(printers);
  });

  app.get("/printers/:printerId/remove", async (req, res) => {
    let printerId = req.params.printerId;

    let printer = await Printer.findById(printerId);

    if (!printer) {
      return res.status(404).send("Impressora não encontrada: " + printerId);
    }

    await printer.deleteOne();

    res.send();
  });

  /*
   * Objects api
   */
  let objectsPath = "../objects";
  app.get("/objects", async (req, res) => {
    let objects = await ObjectStore.read(objectsPath);

    res.send(objects);
  });

  app.use(
    "/objects/files",
    express.static(objectsPath, {
      index: false,
      extensions: ["gcode", "stl", "jpg", "png", "jpeg", "txt"],
      setHeaders: () => {},
    })
  );

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: "Something broke: " + err.stack });
  });
}

function startPoolServer(io) {
  const pooler = new PoolServer("print");
  io.on("connection", (socket) => {
    startWorker(socket, pooler);
  });
}

async function startWorker(socket, pooler) {
  const query = socket.handshake.query;
  const printerInfo = {
    name: query.name,
    queue: query.queue,
  };
  // let iam = socket.handshake.query.printer;
  // let queue = socket.handshake.query.queue;
  let currentJob = null;

  try {
    if (!printerInfo.name) {
      throw new Error("Missing printer name param 'name'");
    }

    if (!printerInfo.queue) {
      throw new Error("Missing queue name param 'queue'");
    }
  } catch (e) {
    await socket.error(e.message);
    await socket.disconnect(true);
    console.log(
      chalk.red(" ! connection closed: " + e.message),
      printerInfo.name
    );
    return;
  }

  console.log(
    chalk.green(" + connection"),
    printerInfo.name,
    `[${chalk.bold(printerInfo.queue)}]`
  );
  await Printer.ping(printerInfo.name);

  socket.on("pool", async () => {
    // if (!iam) {
    //   console.error(" ! Cannot lock job without `iam` name");
    //   return;
    // }

    let job = await pooler.findJobAndLock(printerInfo);

    if (job) {
      console.log(
        chalk.green(` # Job '${job._id}' Assigned to ${printerInfo.name}`)
      );
      currentJob = job;
    }

    Printer.ping(printerInfo.name);

    // console.log(chalk.yellow(' . debug message'))
    socket.emit("job", job);
  });

  socket.on("printerStatus", async (data) => {
    // console.log('printerStatus', status)
    let printer = await Printer.findOrCreate(printerInfo.name);
    printer.ping(data.status);
    printer.set({ state: data.payload || {} });
    await printer.save();
  });

  /*
   * Update job
   */
  socket.on("job", async (data) => {
    let job = await pooler.updateJob(data._id, data.payload);

    // Update job if they are the same
    if (currentJob && job && job.id == currentJob.id) {
      currentJob = job;
    }

    if (job) {
      console.log(
        chalk.green(
          ` # Job '${data._id}' status='${job.status}' ${JSON.stringify(data)}`
        )
      );
      if (job.status == "failed" && job.message) {
        console.log(chalk.dim(" | ") + chalk.red(job.message));
      }
    }

    Printer.ping(printerInfo.name);

    socket.emit("job:" + job._id, job);
  });

  socket.on("disconnect", async () => {
    if (currentJob && currentJob.status == "running") {
      await pooler.resetJob(currentJob._id, {
        message: "Impressora desconectou",
      });
      console.log(
        chalk.red(
          " ! Job finalizado por disconexão de impressora: " + currentJob._id
        ),
        printerInfo.name
      );
    }

    console.log(chalk.red(" - disconnect"), printerInfo.name);
    await Printer.disconnected(printerInfo.name);
  });
}

// Listen for Application wide errors
process.on("unhandledRejection", handleError);
process.on("uncaughtException", handleError);

function handleError(e) {
  console.error("Fatal Error");
  console.error(e.stack);

  console.error("Exiting.");
  process.exit(1);
}

main();
