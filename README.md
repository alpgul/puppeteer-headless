# puppeteer-headless

A headless browser utility for Puppeteer with custom patches for Cloudflare and worker environments.

## Screenshots

<details open>
  <summary>Nopecha</summary>

![Nopecha](out/Nopecha.png)

</details>
<details >
  <summary>Brotector</summary>

![Nopecha](out/Brotector.png)

</details>
<details >
  <summary>Browserscan</summary>

![Nopecha](out/Browserscan.png)

</details>
<details >
  <summary>CreepJS</summary>

![Nopecha](out/CreepJS.png)

</details>
<details >
  <summary>IPHey</summary>

![Nopecha](out/IPHey.png)

</details>
<details >
  <summary>Pixelscan</summary>

![Nopecha](out/Pixelscan.png)

</details>
<details >
  <summary>ReBrowser</summary>

![Nopecha](out/ReBrowser.png)

</details>
<details >
  <summary>Sannysoft</summary>

![Nopecha](out/Sannysoft.png)

</details>
## Features

- **Custom patches and filters for Cloudflare and Worker environments**
- **Headless browser automation with Puppeteer**
- **Easy testability and extensible architecture**
- **Modern TypeScript support**

## Installation

```bash
bun install
```

or

```bash
npm install
```

## Usage

There are two main patch files in the project:

- `src/cfPatch.ts`: Applies custom patches and filters for Cloudflare environments.
- `src/workerPatch.ts`: Applies custom patches and filters for Worker environments.

Both files automatically apply the appropriate patches and filters for their respective environments.

## Build

```bash
bun run build
```

or

```bash
npm run build
```

## Test

Tests are written with `vitest`. To run the tests:

```bash
bun run test
```

or

```bash
npm run test
```

The tests automatically verify browser behavior and patch effects against various bot detection sites.

## Dependencies

- `puppeteer-core`
- `@sparticuz/chromium-min`
- `vitest` (for testing)
- `bun` (optional, for fast development)

## Contribution

Contributions are welcome! Please open an issue or submit a pull request.
