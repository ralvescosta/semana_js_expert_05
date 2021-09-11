import FileHelper from '../../src/fileHelper'
import { logger } from '../../src/logger.js'

import {jest} from '@jest/globals'
import fs from 'fs'

describe('#FileHelper', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'info')
        .mockImplementation()
  })
  describe('#getFileStatus', () => {
    test('it should return file statuses in correct format', async () => {
      const statsMock = {
        dev: 64769,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 5114905,
        size: 188687,
        blocks: 376,
        atimeMs: 1631002799528.7717,
        mtimeMs: 1631002799396.776,
        ctimeMs: 1631002799396.776,
        birthtimeMs: 1631002799396.776,
        atime: '2021-09-07T08:19:59.529Z',
        mtime: '2021-09-07T08:19:59.397Z',
        ctime: '2021-09-07T08:19:59.397Z',
        birthtime: '2021-09-07T08:19:59.397Z'
      }

      const mockUser = 'ralvescosta'
      process.env.USER = mockUser
      const filename = 'file.png'

      jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValueOnce(statsMock)
      jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValueOnce([filename])

      const result = await FileHelper.getFileStatus('/tmp')

      const expectedResult = [{
        size: '189 kB',
        lastModified: statsMock.birthtime,
        owner: 'ralvescosta',
        file: filename
      }]

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
      expect(fs.promises.readdir).toHaveBeenCalledWith('/tmp')
      expect(result).toMatchObject(expectedResult)
    })
  })
})