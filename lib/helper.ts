import dayjs from 'dayjs'
import { ImgType, ImgZipType } from './interface'
import { join } from 'path'
export function getNow () {
  return dayjs().format('YYYY-MM-DD hh:mm:ss')
}

export function zip (img: ImgType): ImgZipType {
  return {
    f: img.fileName,
    w: img.width,
    h: img.height,
    id: img.id
  }
}

export function unzip (
  img: ImgZipType,
  { type, domain, owner, repo, branch, path }
): ImgType {
  const { f: fileName, w: width, h: height, id } = img
  const extname = fileName.split('.').slice(-1)[0]
  const str = domain || 'https://raw.githubusercontent.com'
  const imgUrl = join(str, owner, repo, branch, path, fileName)
  return {
    fileName,
    width,
    height,
    id,
    extname,
    imgUrl,
    type
  }
}
