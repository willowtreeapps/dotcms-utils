import { hostname } from 'os'
import fetch, { RequestInit } from 'node-fetch'
import { DotCMSApp, initDotCMS } from 'dotcms'

// For some reason this type isn't exported so we use a workaround to get it.
type DotCMSConfigurationParams = Parameters<typeof initDotCMS>[0]

/**
 * Extended DotCMS configuration to allow interacting with WebDAV.
 *
 * Username and password are only required for WebDAV. These can be removed
 * when DotCMS support using an API access token for WebDAV.
 * https://github.com/dotCMS/core/issues/18540
 */
interface DotCmsConfig extends DotCMSConfigurationParams {
  /** User used for WebDAV */
  user?: string
  /** Password used for WebDAV */
  password?: string
}

const configMap = new WeakMap<DotCMSApp, DotCmsConfig>()

const getApiClientConfig = (dotCms: DotCMSApp): DotCmsConfig => {
  if (configMap.has(dotCms)) {
    return configMap.get(dotCms)!
  } else {
    throw new Error(
      `No config found for dotCMS client. Make sure it was initialized using ${createDotCmsClient.name}()`
    )
  }
}

/**
 * Helper to create a DotCMS client which stores extra configuration values
 * to use in other helpers.
 * @param config DotCMS configuration
 */
export const createDotCmsClient = (config: DotCmsConfig) => {
  const client = initDotCMS(config)
  configMap.set(client, config)
  return client
}

/**
 * Request an API token.
 * @see https://dotcms.com/docs/latest/rest-api-authentication
 * @param host DotCMS host
 * @param user DotCMS username
 * @param password DotCMS password
 * @param expirationDays Number of days until token expires
 * @param label Custom label to help identify token
 */
export async function getApiToken(
  host: string,
  user: string,
  password: string,
  expirationDays: number = 1,
  label?: string
): Promise<string> {
  const { version } = require('../../package.json')
  const response = await fetch(`${host}/api/v1/authentication/api-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user,
      password,
      expirationDays,
      label: label || `dotcms-utils@${version} token via ${hostname()}`,
    }),
  })
  const data = await response.json()
  const token = data.entity.token
  return token
}

/**
 * Fetch resources from the DotAdmin interface.
 *
 * Useful when content only exists within the DotAdmin site and no REST API is
 * available for a resource. Can sometimes also be used for private APIs only
 * available in the DotAdmin panel.
 *
 * @param dotCms DotCMS app instance
 * @param path URL path to content
 * @param init RequestInit options
 */
export async function fetchDotAdmin(dotCms: DotCMSApp, path: string, init: RequestInit = {}) {
  const config = getApiClientConfig(dotCms)
  const url = `${config.host}${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Cookie: `access_token=${config.token}`,
      ...init.headers,
    },
  })
  return response
}

interface WebDAVOptions {
  path: string
  hostName: string
  languageId?: number | string
}

const encodeBasicAuth = (user: string, password: string) => Buffer.from(`${user}:${password}`).toString('base64')

/**
 * Fetch an asset on the DotCMS file system via WebDAV.
 *
 * Use this only as a convenience for reading content. To write content, create
 * a WebDAV client instance instead.
 *
 * @param dotCms DotCMS app instance
 * @param opts WebDAV options
 * @param init  RequestInit options
 */
export async function fetchWebDAV(dotCms: DotCMSApp, opts: WebDAVOptions, init: RequestInit = {}) {
  const config = getApiClientConfig(dotCms)

  if (!(config.hasOwnProperty('user') && config.hasOwnProperty('password'))) {
    throw new Error(`WebDAV requires basic auth with user credentials. None provided for ${config.host}`)
  }

  const basicAuth = encodeBasicAuth(config.user!, config.password!)
  const url = `${config.host}/webdav/live/${opts.languageId || 1}/${opts.hostName}${opts.path}`
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${basicAuth}`,
      ...init.headers,
    },
  })
}
