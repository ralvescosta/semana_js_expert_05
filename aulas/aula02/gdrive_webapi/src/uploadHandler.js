import Busboy from 'busboy'
import {pipeline} from 'stream/promises'
import fs from 'fs'

export default class UploadHandler {
  constructor({io, socketId, downloadsFolder}){
    this.io = io
    this.socketId = socketId 
    this.downloadsFolder = downloadsFolder
  }

  handleFileBytes(filename){

  }

  async onFile(fieldname, file, filename) {
    await pipeline(
      // readable stream!
      file,
      // transform stream
      this.handleFileBytes.apply(this, [filename]),
      // writable stream
      fs.createWriteStream
    )
  }

  registerEvents(headers, onFinish){
    const busboy = new Busboy({ headers })

    busboy.on('file', this.onFile.bind(this))
    busboy.on('finish', onFinish)

    return busboy
  }
}