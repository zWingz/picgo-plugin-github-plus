import { authenticate, getDataJson, upload } from './octokit'

const defaultConfig = {
  owner: 'zWingz',
  repo: 'imgur',
  branch: 'master'
}

authenticate('3ccd268c3d4679086c84baea7ad2e4c216e8f452')

getDataJson({
  owner: 'zWingz',
  repo: 'imgur',
  branch: 'master'
}).then(e => {
  console.log(e)
})

// upload({
//   ...defaultConfig,
//   path: 'data3.json',
//   message: 'Upload data.json',
//   content: Buffer.from(JSON.stringify([])).toString('base64')
// })
