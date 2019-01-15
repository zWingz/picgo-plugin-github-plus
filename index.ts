import picgo from 'picgo'
import { Notification } from 'electron'
import { getIns } from './lib/octokit'
import { PluginConfig } from 'picgo/dist/utils/interfaces'
import { getNow, zip, unzip } from './lib/helper'
import { ImgType, PluginConfig as PlusConfig } from './lib/interface'
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
        const options: PlusConfig = ctx.getConfig('picBed.githubPlus')
        if (!options) {
          throw new Error("Can't find github-plus config")
        }
        notic('Sync...')
        const octokit = getIns(options)
        octokit.authenticate()
        const githubDataJson = await octokit.getDataJson().catch(e => {
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
              await octokit.updateDataJson({
                data: localDataJson,
                sha
              })
            } else {
              await octokit.createDataJson(localDataJson)
            }
          } catch (e) {
            notic('Error in sync github', e.message)
            throw e
          }
        } else {
          const newUploaded = data
            .map(each => {
              const obj = unzip(each)
              return {
                ...obj,
                type: UploaderName,
                imgUrl: octokit.parseUrl(obj.fileName)
              }
            })
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
  const options: PlusConfig = ctx.getConfig('picBed.githubPlus')
  let output = ctx.output
  // do something for uploading
  if (!options) {
    throw new Error("Can't find github-plus config")
  }
  const octokit = getIns(options)
  octokit.authenticate()
  for (let i in output) {
    try {
      const img = output[i]
      const { imgUrl, sha } = await octokit.upload(img)
      img.imgUrl = imgUrl
      img.sha = sha
    } catch (e) {
      ctx.emit('notification', {
        title: 'GithubPlus: 上传失败',
        body: e.message,
        text: ''
      })
    }
  }
  ctx.saveConfig({
    [PluginName]: {
      lastSync: getNow()
    }
  })
  return ctx
}

function onRemove (files: ImgType[]) {
  notic('fdsa', '' + files[0].sha)
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
      required: false
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
    },
    {
      name: 'customUrl',
      type: 'input',
      default: userConfig.customUrl || '',
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
    ctx.on('remove', onRemove)
  }
  return {
    register,
    guiMenu, // <-- 在这里注册
    uploader: UploaderName,
    config: syncConfig
  }
}
