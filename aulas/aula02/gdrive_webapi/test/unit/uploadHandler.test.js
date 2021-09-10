import UploadHandler from '../../src/uploadHandler'
import fs from 'fs'
import {jest} from '@jest/globals'
import TestUtil from '../_util/testUtil'
import { logger } from '../../src/logger.js'

describe('#UploadHandler', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  }
  beforeEach(() => {
    jest.spyOn(logger, 'info')
        .mockImplementation()
  })
  describe('#registerEvents', () => {
    
    test('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'
    })

    jest.spyOn(uploadHandler, uploadHandler.onFile.name)
        .mockResolvedValue()

    const headers = {
        'content-type': 'multipart/form-data; boundary='
    }
    const onFinish = jest.fn()
    const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

    const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data'])
    busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')

    busboyInstance.listeners("finish")[0].call()

    expect(uploadHandler.onFile).toHaveBeenCalled()
    expect(onFinish).toHaveBeenCalled()
    })
  })

  describe('#onFile', () => {
    test('given a stream file it should dave it on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder: downloadsFolder
      })
      const onDataWritable = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(() => TestUtil.generateWritableStream(onDataWritable))

      const onDataTransforme = jest.fn()
      jest.spyOn(handler, handler.handleFileBytes.name).mockImplementation(() => TestUtil.generateTransformStream(onDataTransforme))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mov'
      }

      await handler.onFile(...Object.values(params))

      expect(onDataWritable.mock.calls.join()).toEqual(chunks.join())
      expect(onDataTransforme.mock.calls.join()).toEqual(chunks.join())

      const expectedFileName = `${handler.downloadsFolder}/${params.filename}`
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFileName)
    })
  })

  describe('#handleFileByte', () => {
    test('should call emit function and it is a transform stream', async () => {
      
    })
  })
})
