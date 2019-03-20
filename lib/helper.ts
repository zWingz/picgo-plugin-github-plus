import dayjs from 'dayjs'
import { ImgType, ImgZipType } from './interface'
import slash from 'normalize-path'
import { join } from 'path'

export function getNow () {
  return dayjs().format('YYYY-MM-DD hh:mm:ss')
}

export function zip (img: ImgType): ImgZipType {
  return {
    f: img.fileName,
    s: img.sha
  }
}

export function unzip (img: ImgZipType): ImgType {
  const { f: fileName, s } = img
  const extname = fileName.split('.').slice(-1)[0]
  return {
    fileName,
    id: s,
    sha: s,
    extname,
    imgUrl: '',
    type: ''
  }
}

export function pathJoin (...arg) {
  return slash(join.apply(null, arg))
}
