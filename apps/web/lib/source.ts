import { docs } from '@/.source/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

export function getLLMText(page: ReturnType<typeof source.getPages>[number]) {
  return `# ${page.data.title}\n\n${page.data.description ?? ''}\n\nURL: ${page.url}`;
}

export function getPageImage(page: ReturnType<typeof source.getPages>[number]) {
  const segments = page.url
    .replace('/docs', '')
    .split('/')
    .filter(Boolean);

  return {
    title: page.data.title,
    description: page.data.description ?? '',
    segments,
  };
}
