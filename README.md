# picgo-plugin-github-plus

plugin for [PicGo](https://github.com/Molunerfinn/PicGo)

- Sync `uploaded` with github use `data.json`
- Sync `remove` action
- Pull `img` info from github

**Don't edit `lastSync`**

## Usage

### Config

- repo: repo name, split by '/', eg: `owner/repoName`
- branch: default `master`
- token: github `access token`
- path: file path
- customUrl: used to insead of `https://raw.githubusercontent.com/:owner/:repo/:branch/:path/:filename`, eg: `${customUrl}/path/filename.jpg`
- origin: `github` or `gitee`, default `github`

makesure the `customUrl` can access your `repo`

![](https://zwing.site/imgur/57566062-a7752000-73fa-11e9-99c1-e3a0562bc41d.png)

### Menu

- Sync origin: Just sync `data.json` (use latest updated)
- Pull origin: Pull all `img` info from origin (**force** and **override** local `data.json`)

## Support gitee

由于`gitee`文件大小有`1mb`限制, 所以超过`1mb`的文件无法通过外链获取

## Related

- [Hyrule](https://github.com/zWingz/Hyrule): A electron app to manage issues and images from github
