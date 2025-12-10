# 変数定義
PROJECT_ID := atomic-segment-479807-h2
REGION := asia-northeast1
SERVICE_NAME := sales-daily-report
IMAGE_NAME := gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)
CLOUD_SQL_CONNECTION_NAME := $(PROJECT_ID):$(REGION):sales-daily-report-db

# デフォルトターゲット
.PHONY: help
help:
	@echo "利用可能なコマンド:"
	@echo "  make install          - 依存関係をインストール"
	@echo "  make dev              - 開発サーバーを起動"
	@echo "  make build            - プロダクションビルド"
	@echo "  make test             - テストを実行"
	@echo "  make lint             - Lintチェック"
	@echo "  make docker-build     - Dockerイメージをビルド"
	@echo "  make docker-run       - Dockerコンテナをローカルで実行"
	@echo "  make docker-push      - Dockerイメージをプッシュ"
	@echo "  make deploy           - Cloud Runにデプロイ"
	@echo "  make deploy-full      - ビルド・プッシュ・デプロイを一括実行"
	@echo "  make setup-gcloud     - gcloud CLIの設定"
	@echo "  make prisma-migrate   - Prismaマイグレーションを実行"

# 依存関係のインストール
.PHONY: install
install:
	npm ci
	npx prisma generate

# 開発サーバーを起動
.PHONY: dev
dev:
	npm run dev

# プロダクションビルド
.PHONY: build
build:
	npm run build

# テストを実行
.PHONY: test
test:
	npm run test

# 全てのテストを実行
.PHONY: test-all
test-all:
	npm run test:all

# Lintチェック
.PHONY: lint
lint:
	npm run lint

# Lintチェックと自動修正
.PHONY: lint-fix
lint-fix:
	npm run lint:fix

# Dockerイメージをビルド
.PHONY: docker-build
docker-build:
	docker build -t $(IMAGE_NAME):latest .

# Dockerイメージにタグを付ける
.PHONY: docker-tag
docker-tag:
	docker tag $(IMAGE_NAME):latest $(IMAGE_NAME):$(shell date +%Y%m%d-%H%M%S)

# Dockerコンテナをローカルで実行
.PHONY: docker-run
docker-run:
	docker run -p 8080:8080 \
		-e DATABASE_URL="${DATABASE_URL}" \
		-e NODE_ENV=production \
		$(IMAGE_NAME):latest

# Dockerイメージをプッシュ
.PHONY: docker-push
docker-push:
	docker push $(IMAGE_NAME):latest

# gcloud CLIの設定
.PHONY: setup-gcloud
setup-gcloud:
	gcloud config set project $(PROJECT_ID)
	gcloud auth configure-docker

# Cloud Runにデプロイ
.PHONY: deploy
deploy:
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):latest \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--allow-unauthenticated \
		--port 8080 \
		--memory 512Mi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 10 \
		--set-env-vars "NODE_ENV=production" \
		--add-cloudsql-instances $(CLOUD_SQL_CONNECTION_NAME)

# Cloud Runにデプロイ（環境変数ファイルを使用）
.PHONY: deploy-with-env
deploy-with-env:
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):latest \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--allow-unauthenticated \
		--port 8080 \
		--memory 512Mi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 10 \
		--env-vars-file .env.production \
		--add-cloudsql-instances $(CLOUD_SQL_CONNECTION_NAME)

# ビルド・プッシュ・デプロイを一括実行
.PHONY: deploy-full
deploy-full: docker-build docker-push deploy
	@echo "デプロイが完了しました"

# Cloud Buildを使用したデプロイ
.PHONY: deploy-cloudbuild
deploy-cloudbuild:
	gcloud builds submit --config cloudbuild.yaml

# Cloud Runのログを表示
.PHONY: logs
logs:
	gcloud run services logs read $(SERVICE_NAME) \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--limit 100

# Cloud Runのサービス情報を表示
.PHONY: describe
describe:
	gcloud run services describe $(SERVICE_NAME) \
		--region $(REGION) \
		--project $(PROJECT_ID)

# Cloud Runのサービスを削除
.PHONY: delete-service
delete-service:
	gcloud run services delete $(SERVICE_NAME) \
		--region $(REGION) \
		--project $(PROJECT_ID)

# Prismaマイグレーション（ローカル）
.PHONY: prisma-migrate
prisma-migrate:
	npx prisma migrate dev

# Prismaマイグレーション（プロダクション）
.PHONY: prisma-migrate-deploy
prisma-migrate-deploy:
	npx prisma migrate deploy

# Prisma Studioを起動
.PHONY: prisma-studio
prisma-studio:
	npx prisma studio

# Cloud SQL Proxyを起動
.PHONY: cloudsql-proxy
cloudsql-proxy:
	cloud_sql_proxy -instances=$(CLOUD_SQL_CONNECTION_NAME)=tcp:5432

# クリーンアップ
.PHONY: clean
clean:
	rm -rf node_modules
	rm -rf .next
	rm -rf coverage
	rm -rf playwright-report
	rm -rf test-results
