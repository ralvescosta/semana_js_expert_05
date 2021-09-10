import Busboy from 'busboy'
import {pipeline} from 'stream'
import {promisify} from 'util'
import fs from 'fs'
import {logger} from './logger'

export default class UploadHandler {
  constructor({io, socketId, downloadsFolder}){
    this.io = io
    this.socketId = socketId 
    this.downloadsFolder = downloadsFolder
  }

  handleFileBytes(filename){

  }

  async onFile(fieldname, file, filename) {
    const saveTo = `${this.downloadsFolder}/${filename}`
    const asyncPipeline = promisify(pipeline)
    await asyncPipeline(
      // readable stream!
      file,
      // transform stream
      this.handleFileBytes.apply(this, [filename]),
      // writable stream
      fs.createWriteStream(saveTo)
    )

    logger.info(`[UploadHandler.onFile] - File: [${filename}] finished`)
  }

  registerEvents(headers, onFinish){
    const busboy = new Busboy({ headers })

    busboy.on('file', this.onFile.bind(this))
    busboy.on('finish', onFinish)

    return busboy
  }
}