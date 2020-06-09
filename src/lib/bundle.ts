import { DotCMSApp } from 'dotcms'
import cheerio from 'cheerio'
import { fetchDotAdmin } from './dotcms-api'

export interface BundleAsset {
  id: string
  name: string
  type: string
}

interface Bundle {
  id: string
  name: string
  assets: BundleAsset[]
}

/**
 * Get all bundles in the publishing queue.
 *
 * There's no REST API available for this yet so for now we scrape the
 * DotAdmin html.
 *
 * @param dotCms DotCMS client
 */
export async function getAllBundles(dotCms: DotCMSApp) {
  const response = await fetchDotAdmin(dotCms, '/html/portlet/ext/contentlet/publishing/view_unpushed_bundles.jsp')
  const html = await response.text()
  const $ = cheerio.load(html)
  const $bundles = $('.listingTable')

  const bundles: Bundle[] = []
  $bundles.each((_, $el) => {
    const id = $('tr:first-child th:first-child > span', $el).text().trim()
    const name = $('tr:first-child th:first-child > b', $el).text().trim()

    const assets: BundleAsset[] = []
    const $assets = $('tr:not(:first-child)', $el)
    $assets.each((_, $asset) => {
      const name = $('strong', $asset).text().trim()

      const contents = $('td', $asset).contents()
      const link = contents.toArray().find((c) => c.type === 'tag' && c.name === 'a')

      let typeNode

      if (link) {
        const linkContents = $(link).contents()
        typeNode = $(linkContents[linkContents.length - 1])
      } else {
        typeNode = $(contents[contents.length - 1])
      }

      const typeText = typeNode.text().split(':').pop()
      const type = typeText ? typeText.trim() : ''

      const onClick = $('.deleteIcon', $asset).attr('onclick') || ''
      const idMatch = onClick.match(/deleteAsset\('(.*?)',/)
      const id = idMatch ? idMatch[1] : ''

      assets.push({
        id,
        name,
        type,
      })
    })

    bundles.push({
      id,
      name,
      assets,
    })
  })

  return bundles
}

/** Get bundle by ID. */
export async function getBundle(dotCms: DotCMSApp, id: string) {
  const bundles = await getAllBundles(dotCms)
  const bundle = bundles.find((b) => b.id === id)
  return bundle
}
