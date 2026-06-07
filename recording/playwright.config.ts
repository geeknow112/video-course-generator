import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: '**/*.ts',
  timeout: 5 * 60 * 1000, // 5分
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  
  use: {
    // 録画設定
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 }
    },
    
    // スクリーンショット
    screenshot: 'on',
    
    // ブラウザ設定
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 30000,
    
    // トレース
    trace: 'on',
    
    // スローモーション（操作を見やすく）
    launchOptions: {
      slowMo: 500
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 日本語表示
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
      },
    },
  ],

  // 出力ディレクトリ
  outputDir: './videos/',
});
