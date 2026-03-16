/**
 * Fumadocs content source for docs.
 * Install fumadocs-core and fumadocs-ui, then use:
 *
 *   import { loader } from 'fumadocs-core/source';
 *   import { createSource } from 'fumadocs-mdx/config'; // or custom Source
 *   export const source = loader(createSource(), { baseUrl: '/docs' });
 *
 * For now we export a minimal stub so the app builds; replace with the real
 * source once fumadocs is configured (e.g. defineDocs + toFumadocsSource).
 */
export const docsBaseUrl = "/docs" as const;
