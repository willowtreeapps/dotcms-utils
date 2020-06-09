import path from 'path'
import { promises as fs } from 'fs'
import { DotCMSApp } from 'dotcms'
import { getApiToken, createDotCmsClient } from './lib/dotcms-api'
const findRoot = require('find-root')

const DEFAULT_CONFIG = 'dotcms.config.json'

interface TargetConfig {
  host: string
  token?: string
  user?: string
  password?: string
}

export interface Config {
  targets: {
    [target: string]: TargetConfig
  }
}

/**
 * Read our custom dotCMS config at the root of the project.
 *
 * First finds the parent directory containing a package.json file, then
 * checks for a dotCMS config file.
 */
export async function readConfig(): Promise<Config | null> {
  let config
  try {
    const root = findRoot(process.cwd())
    const data = await fs.readFile(path.join(root, DEFAULT_CONFIG))
    config = JSON.parse(data.toString())
  } catch (e) {
    return null
  }
  return config
}

/**
 * Writes dotCMS config to the project root.
 * @param config
 */
export async function writeConfig(config: Config): Promise<string> {
  const data = JSON.stringify(config, null, '  ')
  const root = findRoot(process.cwd())
  const filepath = path.join(root, DEFAULT_CONFIG)
  await fs.writeFile(filepath, data)
  return filepath
}

/**
 * Gets a dotCMS client for the target host configuration.
 *
 * If an API token isn't configured, a temporary token will be created and
 * used by the client.
 *
 * @param config
 * @param targetName DotCMS target configuration defined in the config file
 */
export async function getDotCmsApi(config: Config, targetName: string): Promise<DotCMSApp> {
  const { targets } = config
  if (!Object.prototype.hasOwnProperty.call(targets, targetName)) {
    throw new Error(`No target named '${targetName}' found in config`)
  }

  const target = targets[targetName]!

  let token

  if (!target.token && target.user && target.password) {
    token = await getApiToken(target.host, target.user, target.password)
  } else if (target.token) {
    token = target.token
  } else {
    throw new Error(`Target '${targetName}' must provide user credentials or token to authenticate`)
  }

  const api = createDotCmsClient({
    host: target.host,
    token,
    user: target.user,
    password: target.password,
  })

  return api
}
