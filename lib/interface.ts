export interface PluginConfig {
  repo: string,
  branch?: string,
  path?: string,
  token: string,
  customUrl?: string
}

export type ImgType = {
  fileName: string;
  extname: string;
  imgUrl: string;
  width?: number;
  height?: number;
  type: string;
  id: string;
  sha?: string
}

export type ImgZipType = {
  f: string,
  w?: number,
  h?: number,
  id: string,
  s?: string
}
