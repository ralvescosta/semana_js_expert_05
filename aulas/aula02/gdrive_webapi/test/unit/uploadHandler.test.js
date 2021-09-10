import UploadHandler from '../../src/uploadHandler'
import fs from 'fs'
import {jest} from '@jest/globals'
import fs from 'fs'
import TestUtil from '../_util/testUtil'

describe('#UploadHandler', () => {
  describe('#registerEvents', () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => {}
    }
    test('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHandler = new UploadHandler({io: ioObj, socketId: '01'})

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValueOnce()
      const headers = {
        'content-type': 'multipart/form-fata; boundary='
      }
      const onFinish = jest.fn

      const busboyInstance = uploadHandler.registerEvents(headers, onFinish)
      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data'])
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')
      busboyInstance.listeners('finish')[0].call()

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
      const onData = jest.fn
      jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(() => TestUtil.generateWritableStream(onData))
      jest.spyOn(handler, handler.handleFileBytes.name)


    })
  })
})
