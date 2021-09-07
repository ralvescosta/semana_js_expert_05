import Routes from '../../src/routes.js'
import {jest} from '@jest/globals'
describe('#Routes test suit', () => {
  const defaultParams = {
    request: {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      method: '',
      body: {}
    },
    response: {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn()
    },
    values: () => Object.values(defaultParams)
  }
  describe('#setSocket', () => {
    test('setSocket should store io instance', () => {
      const routes = new Routes()
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {}
      }

      routes.setSocketInstance(ioObj)

      expect(routes.io).toStrictEqual(ioObj)
    })
  })

  describe('#handler', () => {
    
    test('given an inexistent route it should choose default route', async () => {
      const routes = new Routes()

      const params = {
        ...defaultParams
      }
      params.request.method = 'something'

      await routes.handler(...params.values())

      expect(params.response.end).toHaveBeenCalledWith('Hello World')
    })
    test('it should set any request with CORS enabled', async () => {
      const routes = new Routes()

      const params = {
        ...defaultParams
      }
      params.request.method = 'something'

      await routes.handler(...params.values())

      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })
    test('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes()

      const params = {
        ...defaultParams
      }
      params.request.method = 'OPTIONS'

      await routes.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(204)
      expect(params.response.end).toHaveBeenCalledWith()
    })
    test('given method POST it should choose post route', async () => {
      const routes = new Routes()

      const params = {
        ...defaultParams
      }
      params.request.method = 'POST'

      await routes.handler(...params.values())

      expect(params.response.end).toHaveBeenCalledWith('')
    })
    test('given method GET it should choose get route', async () => {
      const routes = new Routes()

      const params = {
        ...defaultParams
      }
      params.request.method = 'GET'

      await routes.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(200)
    })

  })

  describe('#get', () => {
    test('given method GET it should list all files downloaded', async ()=> {
      const routes = new Routes()

      const params = {
        ...defaultParams
      }
      const filesStatusesMock = [{
        size: '189 kB',
        lastModified: '2021-09-07T08:19:59.397Z',
        owner: 'ralvescosta',
        file: 'file.txt'
      }]

      jest.spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name).mockResolvedValueOnce(filesStatusesMock)

      params.request.method = 'GET'
      await routes.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenLastCalledWith(200)
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(filesStatusesMock))
    })
  })
})