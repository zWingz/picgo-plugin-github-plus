import dayjs from 'dayjs'
import { ImgType, ImgZipType } from './interface'
export function getNow () {
  return dayjs().format('YYYY-MM-DD hh:mm:ss')
}

export function zip (img: ImgType): ImgZipType {
  return {
    f: img.fileName,
    w: img.width,
    h: img.height,
    id: img.id,
    s: img.sha
  }
}

export function unzip (
  img: ImgZipType
): ImgType {
  const { f: fileName, w: width, h: height, id, s } = img
  const extname = fileName.split('.').slice(-1)[0]
  return {
    fileName,
    width,
    height,
    id,
    sha: s,
    extname,
    imgUrl: '',
    type: ''
  }
}
