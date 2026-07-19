import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./workers/permit-poller/wrangler.jsonc" }
    })
  ],
  test: {
    include: ["tests/permit-poller.worker.vitest.mjs"]
  }
});
