import { defineConfig } from 'vite'

// we have to turn off the webdriverio test runner when running in vscode debug mode
const IS_RUNNING_VSCODE_DEBUG = typeof process.env.VSCODE_INSPECTOR_OPTIONS === 'string';

export default defineConfig({
  test: {
    browser: IS_RUNNING_VSCODE_DEBUG ? {} : {
      provider: 'webdriverio', // or 'webdriverio'
      enabled: true,
      name: 'chrome', // browser name is required
      headless: true,
    },
  }
})