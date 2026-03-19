import { source } from '@/lib/source'
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import defaultMdxComponents from 'fumadocs-ui/mdx'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()
  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc}
    tableOfContent={{
      style: 'clerk', // Options: 'default' | 'clerk'
    }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

