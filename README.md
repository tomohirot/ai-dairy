# 営業日報システム

営業担当者が日々の営業活動を報告し、上長が確認・コメントできる日報管理システムです。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **テスト**: Jest, React Testing Library, Playwright
- **Linter**: ESLint
- **デプロイ**: Google Cloud Run
- **CI/CD**: GitHub Actions

## 主要機能

### 日報作成機能
- 訪問記録登録（1日に複数の顧客訪問を記録可能）
- 課題・相談記録（Problem）
- 翌日計画記録（Plan）

### コメント機能
- 上長が日報のProblem・Planに対してコメント可能

### マスタ管理機能
- 顧客マスタの管理
- 営業マスタの管理（上長との関係性管理）

## プロジェクト構成

```
ai-dairy/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ホームページ
│   └── generated/           # Prisma Client生成ファイル
├── lib/                      # ユーティリティ
│   └── prisma.ts            # Prisma Client設定
├── prisma/                   # Prismaスキーマとマイグレーション
│   └── schema.prisma        # データベーススキーマ
├── __tests__/               # 単体テスト・統合テスト
├── e2e/                     # E2Eテスト
├── .github/workflows/       # GitHub Actions
├── Dockerfile               # Cloud Run用Dockerfile
├── Makefile                 # デプロイコマンド
└── cloudbuild.yaml          # Cloud Build設定
```

## セットアップ

### 前提条件

- Node.js 20以上
- PostgreSQL 15以上
- Docker（デプロイ時）

### 開発環境のセットアップ

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd ai-dairy
```

2. **依存関係のインストール**

```bash
make install
# または
npm ci
npx prisma generate
```

3. **環境変数の設定**

```bash
cp .env.example .env
# .envファイルを編集してDATABASE_URLなどを設定
```

4. **データベースのマイグレーション**

```bash
make prisma-migrate
# または
npx prisma migrate dev
```

5. **開発サーバーの起動**

```bash
make dev
# または
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 利用可能なコマンド

### 開発

```bash
make dev              # 開発サーバーを起動
make build            # プロダクションビルド
make lint             # Lintチェック
make lint-fix         # Lint自動修正
```

### テスト

```bash
make test             # 単体テストを実行
npm run test:watch    # ウォッチモードで実行
npm run test:coverage # カバレッジレポート付きで実行
npm run test:e2e      # E2Eテストを実行
npm run test:all      # すべてのテストを実行
```

詳細は [TEST_GUIDE.md](./TEST_GUIDE.md) を参照してください。

### Prisma

```bash
make prisma-generate  # Prisma Clientを生成
make prisma-migrate   # マイグレーションを実行
make prisma-studio    # Prisma Studioを起動
make prisma-validate  # スキーマを検証
```

### Docker

```bash
make docker-build     # Dockerイメージをビルド
make docker-run       # Dockerコンテナをローカルで実行
make docker-push      # Dockerイメージをプッシュ
```

### デプロイ

```bash
make setup-gcloud     # gcloud CLIを設定
make deploy           # Cloud Runにデプロイ
make deploy-full      # ビルド・プッシュ・デプロイを一括実行
make logs             # Cloud Runのログを表示
```

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## データベーススキーマ

主要なテーブル：

- **SalesPerson**: 営業担当者
- **Customer**: 顧客
- **DailyReport**: 日報
- **VisitRecord**: 訪問記録
- **Comment**: コメント

詳細なER図は [er_diagram.md](./er_diagram.md) を参照してください。

## API仕様

API仕様書は [api_specifications.md](./api_specifications.md) を参照してください。

## 画面仕様

画面仕様書は [screen_specifications.md](./screen_specifications.md) を参照してください。

## テスト仕様

テスト仕様書は [test_specifications.md](./test_specifications.md) を参照してください。

## CI/CD

### GitHub Actions

- **CI** (`.github/workflows/ci.yml`): プルリクエストごとにLint、テスト、ビルドを実行
- **Deploy** (`.github/workflows/deploy.yml`): mainブランチへのマージで自動的にCloud Runにデプロイ

### ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発ブランチ

## デプロイ先

- **本番環境**: Google Cloud Run
  - Project ID: `atomic-segment-479807-h2`
  - Region: `asia-northeast1`
  - Service: `sales-daily-report`

## ライセンス

ISC

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
