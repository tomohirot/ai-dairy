import { test, expect } from '@playwright/test'

test.describe('営業日報システム E2E Tests', () => {
  test('ホームページが正しく表示される', async ({ page }) => {
    await page.goto('/')

    // ページタイトルを確認
    await expect(page.locator('h1')).toContainText('営業日報システム')

    // ウェルカムメッセージを確認
    await expect(page.getByText('営業日報システムへようこそ')).toBeVisible()
  })

  test('ページのメタデータが正しく設定されている', async ({ page }) => {
    await page.goto('/')

    // タイトルタグを確認
    await expect(page).toHaveTitle(/営業日報システム/)
  })
})
