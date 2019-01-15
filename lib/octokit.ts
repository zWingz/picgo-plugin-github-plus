import Octokit from '@octokit/rest'
import picgo from 'picgo'
import axios from 'axios'
import { getNow } from './helper'
let octokit = new Octokit()

let auth = false

export function authenticate (token) {
  octokit.authenticate({
    type: 'token',
    // token: 'd#e8919195a05bd0c3e3c0d5b5bcfd218bc606694'.split('#').join(''),
    token
  })
}

export function updateDataJson ({ owner, repo, branch = 'master', sha }, data) {
  return octokit.repos.updateFile({
    owner,
    branch,
    repo,
    path: 'data.json',
    sha,
    message: `Sync dataJson at ${getNow()}`,
    content: Buffer.from(JSON.stringify(data)).toString('base64')
  })
}
export function createDataJson ({ owner, repo, branch = 'master' }, data) {
  return octokit.repos.createFile({
    owner, repo, branch,
    path: 'data.json',
    message: `Sync dataJson at ${getNow()}`,
    content: Buffer.from(JSON.stringify(data)).toString('base64')
  })
}

export async function getDataJson ({ owner, repo, branch = 'master' }): Promise<{lastSync: string, data: any[], sha?: string}> {
  const defaultRet = {
    lastSync:  '',
    data: []
  }
  const d = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: branch
  })
  const dataJson = d.data.tree.filter(each => each.path === 'data.json')[0]
  if (dataJson) {
    let content = await octokit.git.getBlob({ owner, repo, file_sha: dataJson.sha })
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

export async function upload (
  { owner, repo, path, branch, message, content },
  ctx?: picgo
) {
  const d = await octokit.repos.createFile({
    owner,
    repo,
    path,
    message,
    content,
    branch
  })
  if (d) {
    return d.data.content.download_url
  }
  throw d
  // return ''
}

export default octokit
