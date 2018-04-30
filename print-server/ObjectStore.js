const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const StlThumbnailer = require('node-stl-thumbnailer')

exports.read = async function read(dir) {
  let files = require('fs').readdirSync(dir)

  let objects = []

  for (file of files) {
    let ext = file.replace(/.+\./, '')
    let name = file.replace(/\..+/, '')
    let info = objects.find(obj => obj.name == name)

    if (!info) {
      info = {name, files: {}}
      objects.push(info)
    }
    
    info.files[ext] = file
  }

  // Filter invalid files
  objects = objects.filter(obj => obj.files.gcode || obj.files.stl)

  return objects
}

exports.generateThumbnails = async function generateThumbnails(dir) {
  // Generate object thumbnails
  let missingThumbs = (await exports.read(dir))
    // .filter(obj => !obj.files.png)
    .filter(obj => obj.files.stl)

  if (!missingThumbs.length) {
    return
  }
  
  console.log(chalk.cyan(` ! Generating thumbs for ${missingThumbs.length} objects`))

  for (obj of missingThumbs) {
    let stlPath = path.join(dir, obj.files.stl)
    
    let [thumb] = await new StlThumbnailer({
      filePath: stlPath,
      requestThumbnails: [{
        width: 512, height: 512,
        lineColor: 0x03a9f4,
        baseColor: 0x03a9f4,
        baseOpacity: 0.3,
        cameraAngle: [0, -100, 70], 
      }]
    })

    fs.writeFileSync(path.join(dir, obj.name + '.png'), thumb.toBuffer())
    console.log(chalk.yellow(' . Thumb generated: ' + obj.name))
  }
}