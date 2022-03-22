import picgo from 'picgo'
import { getIns } from './lib/octokit'
import { PluginConfig } from 'picgo/dist/utils/interfaces'
import { getNow, zip, unzip } from './lib/helper'
import { ImgType, PluginConfig as PlusConfig } from './lib/interface'
const PluginName = 'picgo-plugin-github-plus'
const UploaderName = 'githubPlus'
function initOcto (ctx: picgo) {
  const options: PlusConfig = ctx.getConfig('picBed.githubPlus')
  if (!options) {
    throw new Error("Can't find github-plus config")
  }
  const ins = getIns(options)
  return ins
}

function notic (showNotification: Function, title: string, body?: string) {
  showNotification({
    title: 'GithubPlus: ' + title,
    body
  })
}

const SyncGithubMenu = {
  label: 'Sync origin',
  async handle (ctx: picgo, { showNotification }) {
    const octokit = initOcto(ctx)
    notic(showNotification, 'Sync origin...')
    const githubDataJson = await octokit.getDataJson().catch(e => {
      ctx.log.error(e)
      notic(showNotification, 'Error at load dataJson', e.message)
      throw e
    })
    // FIXME: 新版本可能拿不到uploaded, 加个默认
    const uploaded: ImgType[] = ctx.getConfig('uploaded') || []
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
        ctx.log.error(e)
        notic(showNotification, 'Error at sync origin', e.message)
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
    notic(showNotification, 'Sync successful', 'Succeed to sync origin. Please reload PicGo')
  }
}

const PullGithubMenu = {
  label: 'Pull origin',
  handle: async (ctx: picgo, { showNotification }) => {
    const octokit = initOcto(ctx)
    notic(showNotification, 'Pull img from origin...')
    try {
      const { tree } = await octokit.getPathTree()
      const imgList: ImgType[] = tree
        .filter(each => /\.(jpg|png|jpeg|gif|webp)$/.test(each.path))
        .map(each => {
          const unzipImg = unzip({
            f: each.path,
            s: each.sha
          })
          return {
            ...unzipImg,
            type: UploaderName,
            imgUrl: octokit.parseUrl(each.path)
          }
        })
      const uploaded: ImgType[] = (ctx
        .getConfig('uploaded') || [])
        .filter(each => each.type !== UploaderName)
      uploaded.unshift(...imgList)
      ctx.saveConfig({
        uploaded,
        [PluginName]: {
          lastSync: getNow()
        }
      })
      notic(showNotification, 'Pull successful', 'Succeed to pull from origin, Please reload PicGo')
    } catch (e) {
      ctx.log.error(e)
      notic(showNotification, 'Error at pull from origin', e.message)
    }
  }
}

const guiMenu = ctx => {
  return [SyncGithubMenu, PullGithubMenu]
}

const handle = async (ctx: picgo) => {
  let output = ctx.output
  const octokit = initOcto(ctx)
  const ret = []
  const len = output.length
  let index = 0
  async function up () {
    const img = output[index]
    if (index >= len) return
    if (!img) {
      index++
      return up()
    }
    return octokit
      .upload(img)
      .then(({ imgUrl, sha }) => {
        img.imgUrl = imgUrl
        img.sha = sha
        ret.push(img)
        index++
        return up()
      })
      .catch(e => {
        ctx.log.error(e)
        ctx.emit('notification', {
          title: 'GithubPlus: 上传失败',
          body: e.message,
          text: ''
        })
        index++
        return up()
      })
  }
  await up()
  ctx.saveConfig({
    [PluginName]: {
      lastSync: getNow()
    }
  })
  ctx.output = ret
  return ctx
}

async function onRemove (files: ImgType[], { showNotification }) {
  // console.log('1111 =?', this)
  const rms = files.filter(each => each.type === UploaderName)
  if (rms.length === 0) return
  const self: picgo = this
  const ins = initOcto(self)
  const fail = []
  for (let i = 0; i < rms.length; i++) {
    const each = rms[i]
    await ins.removeFile(each).catch((e) => {
      self.log.error(e)
      fail.push(each)
    })
  }
  if (fail.length) {
    // 确保主线程已经把文件从data.json删掉
    const uploaded: ImgType[] = self.getConfig('uploaded') || []
    uploaded.unshift(...fail)
    self.saveConfig({
      uploaded,
      [PluginName]: {
        lastSync: getNow()
      }
    })
  }
  notic(
    showNotification,
    '删除提示',
    fail.length === 0 ? '成功同步删除' : `删除失败${fail.length}个`
  )
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
    },
    {
      name: 'origin',
      type: 'list',
      default: userConfig.type || 'github',
      required: true,
      choices: [{
        name: 'github',
        value: 'github'
      }, {
        name: 'gitee',
        value: 'gitee'
      }]
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
