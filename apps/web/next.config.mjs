import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['@takumi-rs/image-response'],
  transpilePackages: [
    '@sushill/shadcn-scheduler',
    '@shadcn-scheduler/core',
    '@shadcn-scheduler/shell',
    '@shadcn-scheduler/grid-engine',
    '@shadcn-scheduler/view-day',
    '@shadcn-scheduler/view-week',
    '@shadcn-scheduler/view-timeline',
    '@shadcn-scheduler/view-month',
    '@shadcn-scheduler/view-year',
    '@shadcn-scheduler/view-list',
    '@shadcn-scheduler/view-kanban',
    '@shadcn-scheduler/plugin-audit',
    '@shadcn-scheduler/plugin-markers',
    '@shadcn-scheduler/plugin-recurrence',
    '@shadcn-scheduler/plugin-export',
    '@shadcn-scheduler/plugin-histogram',
    '@shadcn-scheduler/plugin-availability',
    '@shadcn-scheduler/plugin-dependencies',
    '@shadcn-scheduler/preset-tv',
    '@shadcn-scheduler/preset-healthcare',
    '@shadcn-scheduler/preset-conference',
    '@shadcn-scheduler/scheduler',
  ],
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
};

export default withMDX(config);
