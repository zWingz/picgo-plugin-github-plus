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

makesure the `customUrl` can access your `repo`

### Menu

- Sync github: Just sync `data.json` (use latest updated)
- Pull github: Pull all `img` info from github (**force** and **override** local `data.json`)
