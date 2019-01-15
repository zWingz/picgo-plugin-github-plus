import picgo from 'picgo'
import { Notification } from 'electron'
import {
  getDataJson,
  upload,
  authenticate,
  updateDataJson,
  createDataJson
} from './lib/octokit'
import { join } from 'path'
import { PluginConfig } from 'picgo/dist/utils/interfaces'
import { getNow, zip, unzip } from './lib/helper'
import { ImgType } from './lib/interface'
const PluginName = 'picgo-plugin-github-plus'
const UploaderName = 'githubPlus'
function notic (title, body?: string) {
  const notification = new Notification({
    title: 'GithubPlus: ' + title,
    body
  })
  notification.show()
}

const guiMenu = (ctx: picgo) => {
  return [
    {
      label: 'Sync github',
      async handle (ctx: picgo) {
        const options = ctx.getConfig('picBed.githubPlus')
        // do something for uploading
        if (!options) {
          throw new Error("Can't find github-plus config")
        }
        const { path, branch, token } = options
        const [owner, repo] = options.repo.split('/')
        notic('Sync...')
        authenticate(token)
        const githubDataJson = await getDataJson({
          owner,
          branch,
          repo
        }).catch(e => {
          notic('Error in load dataJson', e.message)
          throw e
        })
        const uploaded: ImgType[] = ctx.getConfig('uploaded')
        const localDataJson = {
          data: uploaded.filter(each => each.type === UploaderName).map(zip),
          lastSync: (ctx.getConfig(PluginName) || {}).lastSync
        }
        const { sha, lastSync, data } = githubDataJson
        if (localDataJson.lastSync > lastSync) {
          try {
            if (sha) {
              await updateDataJson(
                {
                  owner,
                  repo,
                  branch,
                  sha
                },
                localDataJson
              )
            } else {
              await createDataJson({ owner, repo, branch }, localDataJson)
            }
          } catch (e) {
            notic('Error in sync github', e.message)
            throw e
          }
        } else {
          const newUploaded = data
            .map(each =>
              unzip(each, {
                type: PluginName,
                domain: '',
                owner,
                repo,
                branch,
                path
              })
            )
            .concat(uploaded.filter(each => each.type !== UploaderName))
          ctx.saveConfig({
            uploaded: newUploaded,
            [PluginName]: {
              lastSync
            }
          })
        }
        notic('Symc succeed', 'Succeed to sync github')
      }
    }
  ]
}

const handle = async (ctx: picgo) => {
  const options = ctx.getConfig('picBed.githubPlus')
  let output = ctx.output
  // do something for uploading
  if (!options) {
    throw new Error("Can't find github-plus config")
  }
  const { path, branch, token } = options
  const [owner, repo] = options.repo.split('/')
  if (!repo) {
    throw new Error('Repo error in github-plus config')
  }
  authenticate(token)
  for (let i in output) {
    try {
      const img = output[i]
      const downloadUrl = await upload(
        {
          owner,
          repo,
          branch,
          content:
            img.base64Image || Buffer.from(img.buffer).toString('base64'),
          path: join(path, img.fileName),
          message: `Upload ${img.fileName} by picGo - ${getNow()}`
        },
        ctx
      )
      img.imgUrl = downloadUrl
    } catch (e) {
      ctx.emit('notification', {
        title: 'GithubPlus: 上传失败',
        body: `${e.message}`,
        text: ''
      })
    }
  }
  ctx.saveConfig({
    [PluginName]: {
      lastSync: getNow()
    }
  })
  // ctx.emit('notification', {
  //   title: 'GithubPlus: 上传成功',
  //   body: `已成功上传${output.length}张图片`,
  //   text: ''
  // })
  return ctx
}

const config = (ctx: picgo): PluginConfig[] => {
  let userConfig = ctx.getConfig(`picBed.${UploaderName}`)
  if (!userConfig) {
    userConfig = {}
  }
  const conf = [
    {
      name: 'repo',
      type: 'input',
      default: userConfig.repo || '',
      required: true
    },
    {
      name: 'branch',
      type: 'input',
      default: userConfig.branch || 'master',
      required: true
    },
    {
      name: 'token',
      type: 'input',
      default: userConfig.token || '',
      required: true
    },
    {
      name: 'path',
      type: 'input',
      default: userConfig.path || '',
      required: false
    }
  ]
  return conf
}
const syncConfig = (ctx: picgo): PluginConfig[] => {
  let userConfig = ctx.getConfig(PluginName)
  if (!userConfig) {
    userConfig = {}
  }
  const conf = [
    {
      name: 'lastSync',
      type: 'input',
      default: userConfig.lastSync || '',
      required: false
    }
  ]
  return conf
}

export = (ctx: picgo) => {
  const register = () => {
    // const { githubPlus } = ctx.getConfig('picBed')
    // if (!githubPlus.token) return
    // authenticate(githubPlus.token)
    ctx.helper.uploader.register(UploaderName, { handle, config })
  }
  return {
    register,
    guiMenu, // <-- 在这里注册
    uploader: UploaderName,
    config: syncConfig
  }
}
