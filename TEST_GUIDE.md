# テストガイド

営業日報システムのテスト環境とテスト実行方法について説明します。

## テスト構成

このプロジェクトでは以下の2種類のテストを実装しています：

### 1. 単体テスト・統合テスト (Jest + React Testing Library)

**対象**: コンポーネント、関数、APIルートなど

**ツール**:
- Jest - テストフレームワーク
- React Testing Library - Reactコンポーネントのテスト
- jest-mock-extended - Prismaのモック

**テストファイルの配置**:
```
__tests__/
  ├── app/           # ページコンポーネントのテスト
  ├── lib/           # ユーティリティ関数のテスト
  └── utils/         # テストユーティリティ
```

### 2. E2Eテスト (Playwright)

**対象**: ユーザーの操作フロー全体

**ツール**:
- Playwright - E2Eテストフレームワーク

**テストファイルの配置**:
```
e2e/
  └── *.spec.ts     # E2Eテストファイル
```

## テストコマンド

### 単体テスト・統合テスト

```bash
# テストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジレポート付きでテストを実行
npm run test:coverage
```

### E2Eテスト

```bash
# Playwrightのブラウザをインストール（初回のみ）
npx playwright install

# E2Eテストを実行（ヘッドレスモード）
npm run test:e2e

# UIモードでE2Eテストを実行（デバッグ用）
npm run test:e2e:ui

# ブラウザを表示してE2Eテストを実行
npm run test:e2e:headed
```

### すべてのテストを実行

```bash
npm run test:all
```

## テストの書き方

### コンポーネントのテスト例

```typescript
import { render, screen } from '@/__tests__/utils/test-utils'
import MyComponent from '@/app/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Prismaを使用するテスト例

```typescript
import { prismaMock } from '@/__tests__/utils/prisma-mock'

describe('DailyReport API', () => {
  it('creates a daily report', async () => {
    const mockReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date(),
      problem: 'Test problem',
      plan: 'Test plan',
    }

    prismaMock.dailyReport.create.mockResolvedValue(mockReport)

    // テストコード
  })
})
```

### E2Eテスト例

```typescript
import { test, expect } from '@playwright/test'

test('ログインフロー', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
})
```

## カバレッジ目標

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

カバレッジレポートは `coverage/` ディレクトリに生成されます。

## CI/CDでのテスト実行

GitHubActionsなどのCI環境では以下のコマンドを使用します：

```bash
# CIモードでテストを実行
CI=true npm run test:all
```

## トラブルシューティング

### Playwrightのブラウザが見つからない

```bash
npx playwright install
```

### テストがタイムアウトする

jest.config.tsまたはplaywright.config.tsでタイムアウト設定を調整してください。

### モックがうまく動作しない

jest.setup.tsでグローバルなモック設定を確認してください。
