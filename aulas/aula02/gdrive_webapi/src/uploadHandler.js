import Busboy from 'busboy'
import {pipeline} from 'stream'
import {promisify} from 'util'
import fs from 'fs'
import {logger} from './logger'

export default class UploadHandler {
  constructor({io, socketId, downloadsFolder, messageTimeDelayInMilliseconds = 200}){
    this.io = io
    this.socketId = socketId 
    this.downloadsFolder = downloadsFolder
    this.onUploadEvent = 'file-upload'
    this.lastMessageSent
    this.messageTimeDelayInMilliseconds = messageTimeDelayInMilliseconds
  }

  canExecute(lastExecute) {
    return (Date.now() - lastExecute) > this.messageTimeDelayInMilliseconds
  }

  handleFileBytes(filename){
    this.lastMessageSent = Date.now()

    async function* handleData(source) {
      let processedAlready = 0

      for await (const chunk of source) {
        yield chunk
        
        processedAlready += chunk.length
        if (!this.canExecute(this.lastMessageSent)) {
            continue;
        }

        this.lastMessageSent = Date.now()
        
        this.io.to(this.socketId).emit(this.onUploadEvent, { processedAlready, filename })
        logger.info(`File [${filename}] got ${processedAlready} bytes to ${this.socketId}`)
      }
    }

    return handleData.bind(this)
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