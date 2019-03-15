import { pathJoin, zip, unzip, getNow } from '../lib/helper'
describe('test helper', () => {
  it('test pathJson', () => {
    expect(pathJoin('path', 'to', 'dir')).toEqual('path/to/dir')
    expect(pathJoin('path', '../to', 'dir')).toEqual('to/dir')
    expect(pathJoin('path', '啦啦啦', '中文')).toEqual('path/啦啦啦/中文')
  })

  it('test zip', () => {
    const str = zip({
      fileName: 'filename',
      width: 1000,
      height: 1000,
      id: 'fdsafdsafdsafasdf',
      sha: 'fooiuiouiouio'
    } as any)
    expect(str).toMatchSnapshot('zip')
  })
  it('test unzip', () => {
    const str = unzip({
      f: 'filename',
      w: 1000,
      h: 1000,
      id: 'fdsafdsafdsafasdf',
      s: 'fooiuiouiouio'
    } as any)
    expect(str).toMatchSnapshot('unzip')
  })
})
describe('test getNow', () => {
  const date = global.Date
  beforeEach(() => {
    const mockedDate = new Date(Date.UTC(2019, 1, 21, 16, 10, 20))
    global.Date = class extends Date {
      constructor () {
        super()
        return mockedDate
      }
    } as any
  })
  afterEach(() => {
    global.Date = date
  })
  it('test getNow', () => {
    const now = getNow()
    expect(now).toMatchSnapshot('now')
  })
})
