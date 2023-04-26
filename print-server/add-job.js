const path = require("path");
const chalk = require("chalk");
const mongoose = require("mongoose");

const Task = require("./Task");

const PORT = process.PORT || 9077;

async function main() {
  // Set custom promisse library to use
  mongoose.Promise = global.Promise;
  await mongoose.connect("mongodb://localhost/vending3d");

  // Create task
  for (let k = 0; k < 1; k++) {
    await Task.create({
      queue: "3d:default",
      payload: {
        file: path.join(__dirname, "../objects/S.gcode"),
        name: "Test File",
        description: "Samy",
      },
    });
  }

  process.exit();
}

// Listen for Application wide errors
process.on("unhandledRejection", handleError);
process.on("uncaughtException", handleError);

function handleError(e) {
  console.error("Fatal Error");
  console.error(String(e));
  console.error(e.stack);

  console.error("Exiting.");
  process.exit(1);
}

main();
