import { readdirSync } from "fs";

export default async function read(dir) {
  let files = readdirSync(dir);

  let objects = [];

  for (file of files) {
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
