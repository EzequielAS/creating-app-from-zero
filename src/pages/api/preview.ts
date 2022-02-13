import { Document } from '@prismicio/client/types/documents'
import Prismic from '@prismicio/client'

const apiEndpoint = process.env.PRISMIC_API_ENDPOINT
const accessToken = process.env.PRISMIC_ACCESS_TOKEN

function linkResolver(doc: Document): string {
    if (doc.type === 'post') {
        return `/post/${doc.uid}`
    }
    return '/'
}

const Client = (req = null) => (
    Prismic.client(apiEndpoint, createClientOptions(req, accessToken))
)
  
  
const createClientOptions = (req = null, prismicAccessToken = null) => {
    const reqOption = req ? { req } : {}
    const accessTokenOption = prismicAccessToken ? { accessToken: prismicAccessToken } : {}

    return {
      ...reqOption,
      ...accessTokenOption,
    }
}

export default async (req, res) => {
    const { token: ref, documentId } = req.query

    const redirectUrl = await Client(req)
        .getPreviewResolver(ref, documentId)
        .resolve(linkResolver, '/')

    if (!redirectUrl) {
        return res.status(401).json({ message: 'Invalid token' })
    }

    res.setPreviewData({ ref })

    res.write(
        `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
        <script>window.location.href = '${redirectUrl}'</script>
        </head>`
    )

    res.end()
};