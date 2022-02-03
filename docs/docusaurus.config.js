const path = require ('path')
const math = require('remark-math');
const katex = require('rehype-katex');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'covfee: continuous video feedback tool',
  tagline: 'extensible web framework for continuous annotation',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/covfee/',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'josedvq', // Usually your GitHub org/user name.
  projectName: 'covfee', // Usually your repo name.
  scripts: [
    'https://cdn.jsdelivr.net/gh/josedvq/covfee@8050fa938ae270ae70244c33903ead9d905bca92/covfee/static/js/opencv.js',
  ],
  stylesheets: [
    'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css',
      integrity:
        'sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc',
      crossorigin: 'anonymous',
    }
  ],
  plugins: [path.resolve(__dirname, 'webpack-config-plugin'), 'docusaurus-plugin-sass'],
  themeConfig: {
    colorMode: {
      // "light" | "dark"
      defaultMode: 'light',

      // Hides the switch in the navbar
      // Useful if you want to support a single color mode
      disableSwitch: true
    },
    prism: {
      theme: require('prism-react-renderer/themes/github'),
    },
    announcementBar: {
      id: 'support_us',
      content:
        '<a href="https://github.com/josedvq/covfee">⭐ If you like covfee, give it a star on GitHub!</a>',
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: true,
    },
    navbar: {
      title: 'covfee',
      logo: {
        alt: 'covfee logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          href: 'https://github.com/josedvq/covfee',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Twitter',
              href: 'https://twitter.com/josedvq',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/josedvq/covfee',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Jose Vargas. Docs built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          remarkPlugins: [math],
          rehypePlugins: [katex],
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
