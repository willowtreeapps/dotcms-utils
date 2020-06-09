import { DotCMSApp } from 'dotcms'
import { diff_match_patch as DiffMatchPatch } from 'diff-match-patch'
import { getBundle, BundleAsset } from './lib/bundle'
import { fetchWebDAV } from './lib/dotcms-api'

async function fetchAsset(client: DotCMSApp, asset: BundleAsset) {
  const response = await client.content.query({
    contentType: asset.type.split(' ').join(''),
    queryParams: {
      identifier: asset.id,
    },
    options: {
      depth: '1',
    },
  })
  const { contentlets } = await response.json()

  if (contentlets.length === 0) {
    return { contents: '' }
  }
  const contentlet = contentlets[0]

  const fileResponse = await fetchWebDAV(client, {
    path: contentlet.path,
    hostName: contentlet.hostName,
  })
  const file = await fileResponse.text()
  return { path: contentlet.path, contents: file }
}

/**
 * Diff the content inside a bundle against the content in another DotCMS
 * instance.
 * @param bundleId Bundle ID.
 * @param src The source DotCMS instance containing the bundle.
 * @param dest The destination DotCMS instance to compare against.
 */
export async function diffBundle(bundleId: string, src: DotCMSApp, dest: DotCMSApp): Promise<string> {
  const bundle = await getBundle(src, bundleId)
  if (!bundle) {
    throw new Error(`No bundle with id '${bundleId}' found`)
  }

  const diffHtml = []

  for (const asset of bundle.assets) {
    const [srcFile, destFile] = await Promise.all([fetchAsset(src, asset), fetchAsset(dest, asset)])

    const dmp = new DiffMatchPatch()
    const diffs = dmp.diff_main(destFile.contents, srcFile.contents)
    const html = dmp.diff_prettyHtml(diffs)

    const section = `<details>
<summary>
  <strong>${srcFile.path}</strong> (${asset.id})
</summary>
<pre>${html}</pre>
</details>`
    diffHtml.push(section)
  }

  // TODO: monaco editor with diffing, IntersectionObserver lazy init, syntax highlighting
  const content = `<h1>${bundle.name} bundle diff</h1>
${diffHtml.join('\n')}`
  return content
}
