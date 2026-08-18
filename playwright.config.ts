import { defineConfig } from '@playwright/test';

// A developer HTTP proxy in the environment would otherwise intercept requests
// to the local dev server and answer them with 503.
process.env.NO_PROXY = [process.env.NO_PROXY, 'localhost,127.0.0.1,::1']
  .filter(Boolean)
  .join(',');
process.env.no_proxy = process.env.NO_PROXY;

/**
 * Two suites with very different requirements:
 *
 * - `mocked` stubs the API at the network layer, so it runs unattended from a
 *   clean checkout and is the one that guards refactors. This is what
 *   `pnpm e2e` runs.
 * - `live` is the pre-existing pair of specs that drive a real Go backend on
 *   :8001 with a hand-obtained JWT. They stay useful for verifying against a
 *   real environment, but cannot gate anything automatically, so they are
 *   opt-in via `pnpm e2e:live`.
 *
 * Both need the dev server, which is started automatically below.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,

  /**
   * One worker. Every spec drives the same Vite dev server, so the runs compete
   * for it rather than for CPU -- and measured, the whole suite takes 1.5m
   * serially against 1.2m in parallel. That 18 seconds buys nothing and costs
   * determinism: under parallel load a dialog in sys-user.spec intermittently
   * failed to open, reproducibly in the full suite and never on its own or
   * serially. A flaky suite is worse than a slightly slower one.
   */
  workers: 1,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:9527',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },

  webServer: {
    // `--host` makes vite bind every interface. Without it vite listens on
    // [::1] only, while the readiness probe resolves localhost to 127.0.0.1,
    // so startup detection times out.
    command: 'pnpm dev --host',
    url: 'http://127.0.0.1:9527',
    // Reuse a dev server the developer already has running; always start a
    // fresh one in CI.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },

  projects: [
    {
      name: 'mocked',
      // visual-baseline is a screenshot capture tool, not an assertion suite
      testMatch: /mocked\/(?!visual-baseline).*\.spec\.ts$/
    },
    {
      name: 'shots',
      testMatch: /mocked\/visual-baseline\.spec\.ts$/
    },
    {
      name: 'live',
      testMatch: /e2e\/[^/]*\.spec\.ts$/
    }
  ]
});
