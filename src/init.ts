import { prompt } from 'inquirer'
import { readConfig, writeConfig } from './config'

const validateUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return 'Must provide a valid URL'
  }
}

/**
 * Walk user through initializing a new dotCMS target configuration.
 *
 * The new target configuration will be merged with an existing dotCMS
 * config if one exists.
 */
export async function init() {
  const config = (await readConfig()) || { targets: {} }

  console.log(`This utility will walk you through creating or updating a dotcms.config.json file.

Press ^C at any time to quit.`)

  const values = await prompt([
    {
      type: 'input',
      message: 'Enter a dotCMS host URL',
      name: 'host',
      validate: validateUrl,
    },
    {
      type: 'input',
      message: 'Enter an alias for this host',
      name: 'target',
      validate: (target) => {
        if (config.targets.hasOwnProperty(target)) {
          return `'${target}' has already been configured`
        }
        return true
      },
    },
    {
      type: 'password',
      message: 'Enter an API access token',
      name: 'token',
      mask: '*',
      suffix: `
To find or create a token, follow the instructions in the dotCMS documentation.
https://dotcms.com/docs/latest/rest-api-authentication#APIToken
`,
    },
    {
      type: 'input',
      message: 'Enter a username',
      name: 'user',
    },
    {
      type: 'password',
      message: 'Enter a password',
      name: 'password',
      mask: '*',
    },
  ])

  const { target, ...targetConfig } = values
  config.targets[target] = targetConfig

  const filepath = await writeConfig(config)

  console.log(`Saved configuration to ${filepath}`)
}
