import Octokit from '@octokit/rest'
import { getNow } from './helper'
import { PluginConfig, ImgType } from './interface'
import { join } from 'path'
import { ImgInfo } from 'picgo/dist/utils/interfaces'

// export default octokit

class Octo {
  owner: string = ''
  repo: string = ''
  branch: string = ''
  path: string = ''
  token: string = ''
  customUrl: string = ''
  octokit = new Octokit()
  constructor ({ repo, branch, path = '', token, customUrl = '' }: PluginConfig) {
    const [ owner, r ] = repo.split('/')
    if (!r) throw new Error('Error in repo name')
    this.owner = owner
    this.repo = r
    this.branch = branch || 'master'
    this.path = path
    this.token = token
    this.customUrl = customUrl
  }
  authenticate () {
    this.octokit.authenticate({
      type: 'token',
      token: this.token
    })
  }

  updateDataJson ({ data, sha }) {
    const { owner, repo, branch } = this
    return this.octokit.repos.updateFile({
      owner,
      branch,
      repo,
      path: 'data.json',
      sha,
      message: `Sync dataJson by PicGo at ${getNow()}`,
      content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
  }
  createDataJson (data) {
    const { owner, repo, branch } = this
    return this.octokit.repos.createFile({
      owner,
      repo,
      branch,
      path: 'data.json',
      message: `Sync dataJson by PicGo at ${getNow()}`,
      content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
  }

  async getDataJson (): Promise<{
    lastSync: string;
    data: any[];
    sha?: string;
  }> {
    const { owner, repo, branch } = this
    const defaultRet = {
      lastSync: '',
      data: []
    }
    const d = await this.octokit.git.getTree({
      owner,
      repo,
      tree_sha: branch
    })
    const dataJson = d.data.tree.filter(each => each.path === 'data.json')[0]
    if (dataJson) {
      let content = await this.octokit.git.getBlob({
        owner,
        repo,
        file_sha: dataJson.sha
      })
      const buf = Buffer.from(content.data.content, content.data.encoding)
      const json = JSON.parse(buf.toString())
      return {
        ...defaultRet,
        ...json,
        sha: dataJson.sha
      }
    }
    return defaultRet
  }

  async upload (img: ImgInfo) {
    const { owner, repo, branch, path = '' } = this
    const { fileName } = img
    const d = await this.octokit.repos.createFile({
      owner,
      repo,
      path: join(path, fileName),
      message: `Upload ${fileName} by picGo - ${getNow()}`,
      content: img.base64Image || Buffer.from(img.buffer).toString('base64'),
      branch
    })
    if (d) {
      return {
        imgUrl: this.parseUrl(fileName),
        sha: d.data.content.sha
      }
    }
    throw d
  }
  removeFile (img: ImgType) {
    const { repo, path, owner, branch } = this
    return this.octokit.repos.deleteFile({
      repo,owner,path, branch,
      message: `Deleted ${img.fileName} by picGo - ${getNow()}`,
      sha: img.sha
    })
  }
  parseUrl (fileName) {
    const { repo, path, customUrl } = this
    const domain = customUrl || 'https://raw.githubusercontent.com'
    return join(domain, repo, path, fileName)
  }
}

let ins: Octo = null

export function getIns (config: PluginConfig): Octo {
  if (ins) return ins
  return new Octo(config)
}
