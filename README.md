# picgo-plugin-github-plus

plugin for [PicGo](https://github.com/Molunerfinn/PicGo)

- Sync `uploaded` with github use `data.json`
- Sync `remove` action
- Pull `img` from github

**Don't edit `lastSync`**

## Usage

### Config

- repo: repo name, split by '/', eg: `owner/repoName`
- branch: default `master`
- token: github `access token`
- path: file path
- customUrl: used to insead of `https://raw.githubusercontent.com`, eg: `${customUrl}/repoName/path/filename.jpg`

#### config.CustomUrl

  you need to open `gh-pages` at `mater` to support `customUrl`

### Menu

- Sync github: sync `data.json` (sync `latest update`)
- Pull github: Pull `img` from github (**force** and **ignore** local `data.json`)
