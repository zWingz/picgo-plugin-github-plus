import { getIns, clearIns } from '../lib/octokit'
import { getNow } from '../lib/helper'
import nock from 'nock'

const date = global.Date
beforeAll(() => {
  const mockedDate = new Date(Date.UTC(2019, 1, 21, 16, 10, 20))
  global.Date = class extends Date {
    constructor () {
      super()
      return mockedDate
    }
  } as any
})
afterAll(() => {
  global.Date = date
})

describe('test instance', () => {
  const defaultConfig = {
    repo: 'zwingz/imgur'
  } as any
  beforeEach(() => {
    clearIns()
  })
  it('throw error when repo is empty', () => {
    try {
      getIns({ repo: 'fdsaf' } as any)
    } catch (e) {
      expect(e.message).toEqual('Error in repo name')
    }
  })
  it('singleton pattern', () => {
    const ins = getIns(defaultConfig)
    expect(ins).toEqual(getIns(defaultConfig))
  })
  it('test config', () => {
    const owner = 'fdsa'
    const repo = 'f12131'
    const branch = 'fdsafdsa'
    const token = '12309'
    const customUrl = 'qweqwe'
    const path = 'oijoi'
    const ins = getIns({
      repo: `${owner}/${repo}`,
      branch,
      token,
      customUrl,
      path
    })
    expect(ins.repo).toEqual(repo)
    expect(ins.owner).toEqual(owner)
    expect(ins.branch).toEqual(branch)
    expect(ins.path).toEqual(path)
    expect(ins.token).toEqual(token)
    expect(ins.customUrl).toEqual(customUrl)
  })
})

describe('test api', () => {
  const github = 'https://api.github.com'
  const defaultConfig = {
    repo: 'zwingz/imgur',
    path: 'mock'
  } as any
  let ins = getIns(defaultConfig)
  it('test getTree', async () => {
    const tree = { lalal: 123 }
    const sha = 'fdsaf'
    nock(github)
      .get(`/repos/${ins.owner}/${ins.repo}/git/trees/${sha}`)
      .reply(200, { tree })
    const data = await ins.getTree(sha)
    expect(data).toEqual(tree)
  })
  it('test getPathTree', async () => {
    const sha = 'fdsfdsafdas'
    const retTree = { pathToTree: '12312312' }
    nock(github)
      .get(`/repos/${ins.owner}/${ins.repo}/git/trees/${ins.branch}`)
      .reply(200, { tree: [{ path: 'mock', sha }] })
    nock(github)
      .get(`/repos/${ins.owner}/${ins.repo}/git/trees/${sha}`)
      .reply(200, { tree: retTree })
    const data = await ins.getPathTree()
    expect(data.sha).toEqual(sha)
    expect(data.tree).toEqual(retTree)
  })
  it('reject when path not exist', () => {
    nock(github)
      .get(`/repos/${ins.owner}/${ins.repo}/git/trees/${ins.branch}`)
      .reply(200, { tree: [] })
    return expect(ins.getPathTree()).rejects.toThrow(
      `Can\'t find ${defaultConfig.path}`
    )
  })
  it('test getDataJson', async () => {
    clearIns()
    const sha = 'fdsafa'
    const dataJson = JSON.stringify({
      lastSync: 'fdsaf',
      data: ['fdsa', 'fdsaf']
    })
    defaultConfig.path = ''
    ins = getIns(defaultConfig)
    nock(github)
      .get(`/repos/${ins.owner}/${ins.repo}/git/trees/${ins.branch}`)
      .reply(200, { tree: [{ path: 'data.json', sha }] })
    nock(github)
      .get(`/repos/${ins.owner}/${ins.repo}/git/blobs/${sha}`)
      .reply(200, { content: dataJson, encoding: 'utf-8' })
    const data = await ins.getDataJson()
    expect(data).toMatchObject(JSON.parse(dataJson))
    nock(github)
      .get(`/repos/${ins.owner}/${ins.repo}/git/trees/${ins.branch}`)
      .reply(200, { tree: [] })
    const data2 = await ins.getDataJson()
    expect(data2).toMatchObject({ lastSync: '', data: [] })
  })
  it('test updateDataJson', async () => {
    // /repos/:owner/:repo/contents/:path
    const data = { lalal: 'fdsa' }
    const sha = 'fdsafa'
    nock(github)
      .put(`/repos/${ins.owner}/${ins.repo}/contents/data.json`, body => {
        expect(body.message).toEqual(`Sync dataJson by PicGo at ${getNow()}`)
        expect(body.sha).toEqual(sha)
        expect(body.content).toEqual(
          Buffer.from(JSON.stringify(data)).toString('base64')
        )
        expect(body.branch).toEqual(ins.branch)
        return true
      })
      .reply(200, {})
    await ins.updateDataJson({ data, sha })
  })
  it('test createDataJson', async () => {
    const data = { lalal: 'fdsa' }
    nock(github)
      .put(`/repos/${ins.owner}/${ins.repo}/contents/data.json`, body => {
        expect(body.message).toEqual(`Sync dataJson by PicGo at ${getNow()}`)
        expect(body.content).toEqual(
          Buffer.from(JSON.stringify(data)).toString('base64')
        )
        expect(body.branch).toEqual(ins.branch)
        return true
      })
      .reply(200, {})
    await ins.createDataJson(data)
  })
  it('test upload', async () => {
    const filename = 'testfilename.jpg'
    const base64 = 'fdsafdsafdsa'
    const retSha = 'fdsaf'
    const url = `/repos/${ins.owner}/${ins.repo}/contents/${filename}`
    nock(github)
      .put(url, body => {
        expect(body.message).toEqual(
          `Upload ${filename} by picGo - ${getNow()}`
        )
        expect(body.content).toEqual(base64)
        expect(body.branch).toEqual(ins.branch)
        return true
      })
      .reply(200, { content: { sha: retSha } })
    const data = await ins.upload({
      fileName: filename,
      base64Image: base64
    })
    expect(data.sha).toEqual(retSha)
    const buff = 'llalallafdsa'
    nock(github)
      .put(url, body => {
        expect(body.content).toEqual(Buffer.from(buff).toString('base64'))
        return true
      })
      .reply(200, { content: { sha: retSha } })
    await ins.upload({
      fileName: filename,
      buffer: Buffer.from(buff)
    })
    nock(github)
      .put(url, body => {
        return true
      })
      .reply(500, { error: { sha: retSha } })
    expect(
      ins.upload({ fileName: filename, base64Image: base64 })
    ).rejects.toEqual(expect.anything())
  })
  it('test removeFile', async () => {
    const sha = 'fdsaf'
    const fileName = 'fdsa'
    const url = `/repos/${ins.owner}/${ins.repo}/contents/${fileName}`
    nock(github)
      .delete(url, body => {
        expect(body.sha).toEqual(sha)
        expect(body.message).toEqual(
          `Deleted ${fileName} by PicGo - ${getNow()}`
        )
        return true
      })
      .reply(200, {})
    await ins.removeFile({ sha, fileName } as any)
  })
  it('test parseUrl', () => {
    const customUrl = 'dfsafda'
    ins.customUrl = customUrl
    const fileName = 'lfdsa'
    let ret = ins.parseUrl(fileName)
    expect(ret).toEqual(`${customUrl}/${fileName}`)
    ins.customUrl = ''
    ret = ins.parseUrl(fileName)
    expect(ret).toEqual(
      `https://raw.githubusercontent.com/${ins.owner}/${ins.repo}/${
        ins.branch
      }/${fileName}`
    )
  })
})
