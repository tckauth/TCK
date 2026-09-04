import { mkdir, rm, writeFile } from 'node:fs/promises';

await rm('dist/server', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });
await writeFile(
  'dist/server/wrangler.json',
  JSON.stringify({
    name: 'tck-ehs',
    compatibility_date: '2026-05-22',
    assets: {
      directory: '../client',
      not_found_handling: 'single-page-application',
      html_handling: 'auto-trailing-slash',
    },
  }, null, 2),
);
