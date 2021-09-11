import UploadHandler from '../../src/uploadHandler'
import TestUtil from '../_util/testUtil'
import { logger } from '../../src/logger.js'

import fs from 'fs'
import {pipeline} from 'stream'
import { promisify } from 'util'
import {jest} from '@jest/globals'

describe('#UploadHandler', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  }
  beforeEach(() => {
    jest.spyOn(logger, 'info')
        .mockImplementation()
    jest.clearAllMocks()
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
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })

      jest.spyOn(handler, handler.canExecute.name).mockReturnValueOnce(true)
      const messages = ['chunk']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite)

      await promisify(pipeline)(
        source,
        handler.handleFileBytes("filename.txt"),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)
      expect(onWrite).toHaveBeenCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })

    test('given message timerDelay as 2secs it should emit only two messages during 2 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name)

      const day = '2021-07-01 01:01'
      const twoSecondsPeriod = 2000
      
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)

      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
      const onSecondUpdateLastMessageSent = onFirstCanExecute

      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)

      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)
      
      TestUtil.mockDateNow(
          [
              onFirstLastMessageSent,
              onFirstCanExecute,
              onSecondUpdateLastMessageSent,
              onSecondCanExecute,
              onThirdCanExecute,
          ]
      )

      const messages = ["hello", "hello", "world"]
      const filename = 'filename.avi'
      const expectedMessageSent = 2

      const source = TestUtil.generateReadableStream(messages)
      const handler = new UploadHandler({
          messageTimeDelay: twoSecondsPeriod,
          io: ioObj,
          socketId: '01',
      })

      await promisify(pipeline)(
          source,
          handler.handleFileBytes(filename)
      )

      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent)

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls
      
      expect(firstCallResult).toEqual([handler.onUploadEvent, { processedAlready: "hello".length, filename }])
      expect(secondCallResult).toEqual([handler.onUploadEvent, { processedAlready: messages.join("").length, filename }])
    })
  })

  describe('#canExecute', () => {
    
    test('should return true when time is later than specified delay', () => {
      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:03')
      TestUtil.mockDateNow([tickNow])
      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelayInMilliseconds: 1000
      })

      const result = uploadHandler.canExecute(lastExecution)

      expect(result).toBeTruthy()
    })
    test('should return false when time isn\'t later than specified delay', () => {
      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:01')
      TestUtil.mockDateNow([tickNow])
      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelayInMilliseconds: 3000
      })

      const result = uploadHandler.canExecute(lastExecution)

      expect(result).toBeFalsy()
    })
  })
})
