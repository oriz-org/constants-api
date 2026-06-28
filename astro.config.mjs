// @ts-check
import { defineConfig } from 'astro/config';
import orizFleet from '@oriz/api-fleet-template';

export default defineConfig({
  output: 'static',
  site: 'https://constants.oriz.in',
  integrations: [
    orizFleet({
      apiName: 'constants',
      apiTitle: 'Physics Constants API',
      apiDescription: 'Free static API for 355 CODATA 2022 fundamental physical constants — values, uncertainties, units. No auth, no rate limit, no cost.',
      stats: '355 constants · CODATA 2022 · NIST',
      themeColor: 'indigo',
      githubRepo: 'oriz-org/constants-api',
      sampleEndpoint: '/constants/speed-of-light-in-vacuum.json',
      sampleResponse: {
        slug: 'speed-of-light-in-vacuum',
        name: 'speed of light in vacuum',
        value: 299792458,
        value_string: '299 792 458',
        uncertainty: null,
        uncertainty_string: 'exact',
        unit: 'm s^-1',
        exact: true,
        category: 'universal',
        source: 'CODATA 2022 (NIST)',
        source_url: 'https://physics.nist.gov/cuu/Constants/',
      },
      dataDirs: ['constants'],
      indexFiles: ['index.json', 'all.json', 'categories.json'],
    }),
  ],
});
