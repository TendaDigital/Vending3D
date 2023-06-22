import { readdirSync } from "fs";

export async function readObjectStore(dir) {
  let files = readdirSync(dir);

  let objects = [];

  for (let file of files) {
    let ext = file.replace(/.+\./, "");
    let name = file.replace(/\..+/, "");
    let info = objects.find((obj) => obj.name == name);

    if (!info) {
      info = { name, files: {} };
      objects.push(info);
    }

    info.files[ext] = file;
  }

  // Filter invalid files
  objects = objects.filter((obj) => obj.files.gcode || obj.files.stl);

  return objects;
}