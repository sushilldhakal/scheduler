import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { FullWidthToggleNav } from '@/components/docs/FullWidthToggleNav';

export const gitConfig = {
  user: 'sushilldhakal',
  repo: 'scheduler',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'shadcn-scheduler',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    themeSwitch: {
      enabled: true,
      mode: 'light-dark-system',
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Examples',
        url: '/docs/examples/full-roster',
        active: 'nested-url',
      },
      {
        type: 'custom',
        on: 'nav',
        children: <FullWidthToggleNav />,
      },
    ],
  };
}


