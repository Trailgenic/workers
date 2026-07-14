import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './tool-registry/wrangler.jsonc' }
    })
  ],
  test: {
    include: ['tests/worker.vitest.mjs']
  }
});
