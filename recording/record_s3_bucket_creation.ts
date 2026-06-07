/**
 * AWSコンソールログイン画面の録画テスト
 * 
 * 使い方:
 *   npx playwright test record_s3_bucket_creation.ts --headed
 */

import { test } from '@playwright/test';

test('AWSコンソールにアクセス', async ({ page }) => {
  // AWSコンソールにアクセス
  await page.goto('https://console.aws.amazon.com/');
  
  // ログイン画面が表示されるまで待機
  await page.waitForTimeout(5000);
  
  console.log('ログイン画面表示完了');
  
  // 10秒待機して録画
  await page.waitForTimeout(10000);
});
