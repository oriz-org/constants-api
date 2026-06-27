# constants-api

Free static API for CODATA 2022 fundamental physical constants. **355 constants**, every record served as a JSON file. No auth, no rate limit, no quota.

- **Docs + landing**: https://constants.oriz.in
- **Single record**: https://constants.oriz.in/constants/speed-of-light-in-vacuum.json
- **All records**: https://constants.oriz.in/all.json
- **Categories**: https://constants.oriz.in/categories.json
- **Index (slugs)**: https://constants.oriz.in/index.json
- **jsDelivr mirror**: https://cdn.jsdelivr.net/gh/oriz-org/constants-api@main/constants/planck-constant.json

## Schema

```ts
type Constant = {
  slug:               string;           // e.g. "planck-constant"
  name:               string;           // CODATA-canonical name
  value:              number | string;
  value_string:       string;           // "6.626 070 15 e-34"
  uncertainty:        number | null;    // null when exact
  uncertainty_string: string;           // raw, or "exact"
  unit:               string | null;
  exact:              boolean;
  category:           "universal" | "electromagnetic" | "atomic-and-nuclear" | "physico-chemical" | "conversions-and-adopted" | "photometric";
  source:             "CODATA 2022 (NIST)";
  source_url:         string;
};
```

## Data source

2022 CODATA recommended values, scraped from the NIST canonical ASCII listing:
https://physics.nist.gov/cuu/Constants/Table/allascii.txt

The frozen copy used for the current build lives at `scripts/codata2022.txt`. To refresh:

```
curl -sSL https://physics.nist.gov/cuu/Constants/Table/allascii.txt -o scripts/codata2022.txt
npm run data
```

NIST works are in the public domain in the United States.

## Build

```
npm install
npm run data    # generate constants/*.json + index/all/categories from scripts/codata2022.txt
npm run dev     # local dev server
npm run build   # static build into dist/
```

`scripts/prebuild.cjs` mirrors repo-root data into `public/` before Astro builds so the JSON ships in `dist/` and jsDelivr URLs (which read from the repo root) stay stable.

## Licenses

- **Code** (`scripts/`, `src/`, build tooling): [MIT](./LICENSE)
- **Data** (`constants/`, `*.json`): NIST public-domain values, redistributed as-is.
