import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'operation-planner-ufe',
  globalScript: 'src/global/app.ts',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
  testing: {
    browserHeadless: 'new',
  },
};
