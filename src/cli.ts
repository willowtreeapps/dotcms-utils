// Entry point for the CLI application.
// New commands should be defined in this file.

import { promises as fs } from 'fs'
import path from 'path'
import { program } from 'commander'

import { readConfig, getDotCmsApi, writeConfig } from './config'
import { diffBundle } from './bundle-diff'
import { init } from './init'
import { getApiToken } from './lib/dotcms-api'

const readAndValidateConfig = async () => {
  const config = await readConfig()
  if (config) return config
  console.error(`Failed to open dotcms.config.json`)
  process.exit(1)
}

program.command('init').description('Initialize your dotCMS config').action(init)

program
  .command('config')
  .description('Print your dotCMS config')
  .action(async () => {
    const config = await readAndValidateConfig()
    console.log(config)
  })

program
  .command('token <target>')
  .description('output API access token')
  .option('--create', 'generate a new API access token', false)
  .option('--save', 'persist token in config', false)
  .option('--label', 'label for the token')
  .option('--expiration', 'number of days until the token expires')
  .action(
    async (
      target: string,
      cmdObj: {
        create: boolean
        save: boolean
        label?: string
        expiration?: number
      }
    ) => {
      const config = await readAndValidateConfig()
      const targetConfig = config.targets[target]
      if (!targetConfig) {
        console.error(`No target named ${target}`)
        process.exit(1)
      }
      if (!(targetConfig.hasOwnProperty('user') && targetConfig.hasOwnProperty('password'))) {
        console.error(`Config for ${target} must specify user and password`)
        process.exit(1)
      }
      if (cmdObj.create) {
        const token = await getApiToken(
          targetConfig.host,
          targetConfig.user!,
          targetConfig.password!,
          cmdObj.expiration,
          cmdObj.label
        )
        if (cmdObj.save) {
          targetConfig.token = token
          await writeConfig(config)
        }
        console.log(token)
      } else if (targetConfig.token) {
        console.log(targetConfig.token)
      }
    }
  )

program
  .command('bundle-diff <src> <dest> <bundleId>')
  .option('-O, --out <path>', 'set the output location for the produced diff')
  .description('Generate the diff of a bundle between two dotCMS hosts')
  .action(async (src: string, dest: string, bundleId: string, cmdObj: { out?: string }) => {
    const config = await readAndValidateConfig()
    const [srcClient, destClient] = await Promise.all([getDotCmsApi(config, src), getDotCmsApi(config, dest)])

    const diffHtml = await diffBundle(bundleId, srcClient, destClient)

    const filepath = cmdObj.out || path.join(process.cwd(), 'diff.html')
    await fs.writeFile(filepath, diffHtml)
  })

program.arguments('<name>').option('-t, --target <target>', 'dotCMS host target').parse(process.argv)
