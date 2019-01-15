# picgo-plugin-github-plus

- Sync `uploaded` with github use `data.json`
- Can't edit `pluginc-config.lastSync`
- Not support `remove` action

## Usage

### Config

- repo: repo name, split by '/', eg: `owner/repoName`
- branch: default `master`
- token: github `access token`
- path: file path
- customUrl: used to insead of `https://raw.githubusercontent.com`, eg: `${customUrl}/repoName/path/filename.jpg`

#### CustomUrl

  you need to open `gh-pages` at `mater` to support `customUrl`
