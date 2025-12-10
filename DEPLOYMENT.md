# デプロイメントガイド

営業日報システムをGoogle Cloud Runにデプロイする手順を説明します。

## 前提条件

- Google Cloud Platform (GCP) アカウント
- gcloud CLI がインストールされている
- Docker がインストールされている
- プロジェクトID: `atomic-segment-479807-h2`

## 初期セットアップ

### 1. gcloud CLIの設定

```bash
# gcloud CLIでログイン
gcloud auth login

# プロジェクトを設定
make setup-gcloud

# または直接コマンドで設定
gcloud config set project atomic-segment-479807-h2
gcloud auth configure-docker
```

### 2. Cloud SQLの設定

```bash
# Cloud SQLインスタンスを作成
gcloud sql instances create sales-daily-report-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-northeast1 \
  --project=atomic-segment-479807-h2

# データベースを作成
gcloud sql databases create sales_daily_report \
  --instance=sales-daily-report-db \
  --project=atomic-segment-479807-h2

# ユーザーを作成
gcloud sql users create dbuser \
  --instance=sales-daily-report-db \
  --password=YOUR_SECURE_PASSWORD \
  --project=atomic-segment-479807-h2
```

### 3. Secret Managerに環境変数を保存

```bash
# DATABASE_URLをSecretとして保存
echo -n "postgresql://dbuser:YOUR_PASSWORD@/sales_daily_report?host=/cloudsql/atomic-segment-479807-h2:asia-northeast1:sales-daily-report-db" | \
  gcloud secrets create DATABASE_URL \
    --data-file=- \
    --replication-policy=automatic \
    --project=atomic-segment-479807-h2

# Cloud Runサービスアカウントに権限を付与
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT@atomic-segment-479807-h2.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor \
  --project=atomic-segment-479807-h2
```

## デプロイ方法

### 方法1: Makefileを使用したデプロイ

最も簡単な方法です。

```bash
# ビルド、プッシュ、デプロイを一括実行
make deploy-full

# 個別に実行する場合
make docker-build    # Dockerイメージをビルド
make docker-push     # Dockerイメージをプッシュ
make deploy          # Cloud Runにデプロイ
```

### 方法2: Cloud Buildを使用したデプロイ

```bash
# Cloud Buildでビルドとデプロイを実行
make deploy-cloudbuild

# または直接コマンドで実行
gcloud builds submit --config cloudbuild.yaml
```

### 方法3: GitHub Actionsを使用した自動デプロイ

mainブランチにプッシュすると自動的にデプロイされます。

#### GitHub Secretsの設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

1. **Workload Identity Federation（推奨）**:
   - `WIF_PROVIDER`: Workload Identity ProviderのリソースID
   - `WIF_SERVICE_ACCOUNT`: サービスアカウントのメールアドレス

2. **サービスアカウントキー（代替）**:
   - `GCP_SA_KEY`: サービスアカウントのJSONキー

## Prismaマイグレーション

### ローカルからCloud SQLへマイグレーション

```bash
# Cloud SQL Proxyを起動
make cloudsql-proxy

# 別のターミナルでマイグレーションを実行
DATABASE_URL="postgresql://dbuser:password@localhost:5432/sales_daily_report" \
  make prisma-migrate-deploy
```

### Cloud Runからマイグレーション

Cloud Runサービスに一時的にSSHして実行するか、Cloud Run Jobsを使用します。

```bash
# Cloud Run Jobsでマイグレーションを実行
gcloud run jobs create prisma-migrate \
  --image gcr.io/atomic-segment-479807-h2/sales-daily-report:latest \
  --region asia-northeast1 \
  --set-secrets DATABASE_URL=DATABASE_URL:latest \
  --command npx \
  --args prisma,migrate,deploy
```

## 環境変数の設定

### Cloud Runサービスに環境変数を設定

```bash
# 環境変数を設定
gcloud run services update sales-daily-report \
  --set-env-vars "NODE_ENV=production" \
  --region asia-northeast1 \
  --project atomic-segment-479807-h2

# Secretを環境変数として設定
gcloud run services update sales-daily-report \
  --set-secrets DATABASE_URL=DATABASE_URL:latest \
  --region asia-northeast1 \
  --project atomic-segment-479807-h2
```

## デプロイ後の確認

### サービスの状態を確認

```bash
# サービス情報を表示
make describe

# ログを表示
make logs

# サービスURLを取得
gcloud run services describe sales-daily-report \
  --region asia-northeast1 \
  --format 'value(status.url)'
```

### 動作確認

```bash
# サービスURLにアクセス
curl https://sales-daily-report-XXXXX-an.a.run.app
```

## トラブルシューティング

### デプロイが失敗する

1. ログを確認:
   ```bash
   make logs
   ```

2. ビルドログを確認:
   ```bash
   gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')
   ```

### データベース接続エラー

1. Cloud SQL接続名を確認:
   ```bash
   gcloud sql instances describe sales-daily-report-db \
     --format='value(connectionName)'
   ```

2. DATABASE_URL Secretを確認:
   ```bash
   gcloud secrets versions access latest --secret=DATABASE_URL
   ```

3. サービスアカウントの権限を確認:
   ```bash
   gcloud projects get-iam-policy atomic-segment-479807-h2
   ```

### コンテナが起動しない

1. ローカルでDockerイメージをテスト:
   ```bash
   make docker-build
   make docker-run
   ```

2. メモリやCPUの設定を調整:
   ```bash
   gcloud run services update sales-daily-report \
     --memory 1Gi \
     --cpu 2
   ```

## ロールバック

問題が発生した場合、以前のリビジョンにロールバックできます。

```bash
# リビジョン一覧を表示
gcloud run revisions list \
  --service sales-daily-report \
  --region asia-northeast1

# 特定のリビジョンにロールバック
gcloud run services update-traffic sales-daily-report \
  --to-revisions REVISION_NAME=100 \
  --region asia-northeast1
```

## コスト最適化

### オートスケーリングの設定

```bash
# 最小インスタンス数を0に設定（コスト削減）
gcloud run services update sales-daily-report \
  --min-instances 0 \
  --max-instances 10 \
  --region asia-northeast1

# リクエストごとの同時実行数を設定
gcloud run services update sales-daily-report \
  --concurrency 80 \
  --region asia-northeast1
```

### Cloud SQLの停止（開発環境のみ）

```bash
# インスタンスを停止
gcloud sql instances patch sales-daily-report-db --activation-policy NEVER

# インスタンスを起動
gcloud sql instances patch sales-daily-report-db --activation-policy ALWAYS
```

## CI/CDパイプライン

### GitHub Actionsワークフロー

- **CI** (`.github/workflows/ci.yml`): プルリクエストごとにテスト実行
- **Deploy** (`.github/workflows/deploy.yml`): mainブランチへのマージで自動デプロイ

### ワークフローのトリガー

```bash
# 手動でデプロイワークフローを実行
gh workflow run deploy.yml
```

## セキュリティ

### 推奨事項

1. **認証の有効化**: 本番環境では `--no-allow-unauthenticated` を使用
2. **VPCコネクタの使用**: プライベートネットワークを構成
3. **IAMロールの最小権限**: サービスアカウントに必要最小限の権限のみ付与
4. **Secretの定期的なローテーション**: DATABASE_URLやSESSION_SECRETを定期的に更新

## 参考リンク

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Cloud SQL ドキュメント](https://cloud.google.com/sql/docs)
- [Next.js デプロイメント](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
