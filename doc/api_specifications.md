# 営業日報システム API仕様書

## 目次
1. [概要](#概要)
2. [認証](#認証)
3. [共通仕様](#共通仕様)
4. [エンドポイント一覧](#エンドポイント一覧)
5. [API詳細](#api詳細)
6. [エラーコード](#エラーコード)

---

## 概要

### ベースURL
```
https://api.example.com/v1
```

### プロトコル
- HTTPS のみ使用
- HTTP/1.1 または HTTP/2

### データフォーマット
- リクエスト: JSON (Content-Type: application/json)
- レスポンス: JSON (Content-Type: application/json; charset=utf-8)

### 文字コード
- UTF-8

---

## 認証

### 認証方式
JWT (JSON Web Token) を使用

### 認証フロー

#### 1. ログイン
```http
POST /auth/login
```

リクエスト:
```json
{
  "email": "tanaka@example.com",
  "password": "password123"
}
```

レスポンス:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "sales_id": 123,
    "sales_name": "田中太郎",
    "email": "tanaka@example.com",
    "department": "営業1課",
    "role": "sales"
  }
}
```

#### 2. トークン更新
```http
POST /auth/refresh
```

リクエスト:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

レスポンス:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### 3. ログアウト
```http
POST /auth/logout
Authorization: Bearer {access_token}
```

レスポンス:
```json
{
  "message": "ログアウトしました"
}
```

### 認証ヘッダー
全ての保護されたエンドポイントでは以下のヘッダーが必要:

```http
Authorization: Bearer {access_token}
```

---

## 共通仕様

### ページネーション
リスト取得APIでは以下のクエリパラメータでページネーションを制御:

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| page | integer | 1 | ページ番号 |
| per_page | integer | 20 | 1ページあたりの件数（最大100） |

レスポンス例:
```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_count": 95,
    "has_next": true,
    "has_prev": false
  }
}
```

### ソート
リスト取得APIでは以下のクエリパラメータでソートを制御:

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| sort_by | string | ソート対象のフィールド名 |
| order | string | asc (昇順) または desc (降順) |

例:
```
GET /daily-reports?sort_by=report_date&order=desc
```

### フィルタリング
各リソースに応じたフィルタパラメータを使用:

例:
```
GET /daily-reports?sales_id=123&start_date=2024-12-01&end_date=2024-12-31
```

### 日時フォーマット
ISO 8601 形式を使用:
```
2024-12-10T18:30:00+09:00
```

### レスポンス共通フィールド

#### 成功時
```json
{
  "data": { ... },
  "message": "成功メッセージ"
}
```

#### エラー時
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [
      {
        "field": "email",
        "message": "メールアドレスの形式が正しくありません"
      }
    ]
  }
}
```

---

## エンドポイント一覧

### 認証
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | /auth/login | ログイン |
| POST | /auth/refresh | トークン更新 |
| POST | /auth/logout | ログアウト |

### 日報
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /daily-reports | 日報一覧取得 |
| GET | /daily-reports/{id} | 日報詳細取得 |
| POST | /daily-reports | 日報作成 |
| PUT | /daily-reports/{id} | 日報更新 |
| DELETE | /daily-reports/{id} | 日報削除 |
| GET | /daily-reports/{id}/comments | 日報のコメント一覧取得 |
| POST | /daily-reports/{id}/comments | 日報にコメント追加 |

### 訪問記録
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /visit-records | 訪問記録一覧取得 |
| POST | /visit-records | 訪問記録作成 |
| PUT | /visit-records/{id} | 訪問記録更新 |
| DELETE | /visit-records/{id} | 訪問記録削除 |

### 顧客マスタ
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /customers | 顧客一覧取得 |
| GET | /customers/{id} | 顧客詳細取得 |
| POST | /customers | 顧客作成 |
| PUT | /customers/{id} | 顧客更新 |
| DELETE | /customers/{id} | 顧客削除（論理削除） |
| GET | /customers/search | 顧客検索 |

### 営業マスタ
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /sales-persons | 営業一覧取得 |
| GET | /sales-persons/{id} | 営業詳細取得 |
| POST | /sales-persons | 営業作成 |
| PUT | /sales-persons/{id} | 営業更新 |
| DELETE | /sales-persons/{id} | 営業削除（論理削除） |
| GET | /sales-persons/{id}/subordinates | 部下一覧取得 |

### コメント
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| PUT | /comments/{id} | コメント更新 |
| DELETE | /comments/{id} | コメント削除 |

### ダッシュボード
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /dashboard/summary | ダッシュボード概要取得 |
| GET | /dashboard/notifications | 通知一覧取得 |

---

## API詳細

### 日報API

#### 日報一覧取得
```http
GET /daily-reports
```

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| sales_id | integer | - | 営業ID（指定しない場合は自分の日報） |
| start_date | date | - | 開始日（YYYY-MM-DD） |
| end_date | date | - | 終了日（YYYY-MM-DD） |
| has_comment | boolean | - | コメントの有無でフィルタ |
| page | integer | - | ページ番号 |
| per_page | integer | - | 1ページあたりの件数 |

**レスポンス例**
```json
{
  "data": [
    {
      "report_id": 1,
      "sales_id": 123,
      "sales_name": "田中太郎",
      "report_date": "2024-12-10",
      "visit_count": 3,
      "has_problem": true,
      "has_plan": true,
      "comment_count": 2,
      "unread_comment_count": 1,
      "created_at": "2024-12-10T18:30:00+09:00",
      "updated_at": "2024-12-10T20:15:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_count": 95,
    "has_next": true,
    "has_prev": false
  }
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー
- 403: 権限エラー

---

#### 日報詳細取得
```http
GET /daily-reports/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

**レスポンス例**
```json
{
  "data": {
    "report_id": 1,
    "sales_id": 123,
    "sales_name": "田中太郎",
    "department": "営業1課",
    "report_date": "2024-12-10",
    "problem": "株式会社テストの契約更新について、価格調整の権限をどこまで持つべきか相談したい。",
    "plan": "・株式会社サンプルへの見積書作成\n・株式会社テストへの価格調整案の提示\n・新規見込み客3社へのアポイント電話",
    "visit_records": [
      {
        "visit_id": 101,
        "customer_id": 501,
        "customer_name": "株式会社サンプル",
        "visit_content": "新商品のプレゼンテーションを実施。先方の関心は高く、次回見積提出の約束を取り付けた。",
        "visit_order": 1
      },
      {
        "visit_id": 102,
        "customer_id": 502,
        "customer_name": "株式会社テスト",
        "visit_content": "既存契約の更新について打ち合わせ。価格面での調整が必要。",
        "visit_order": 2
      }
    ],
    "comments": [
      {
        "comment_id": 201,
        "commenter_id": 100,
        "commenter_name": "山田部長",
        "comment_content": "株式会社テストの件、最大10%までの値引きは承認します。明日の午前中に一度相談してください。",
        "created_at": "2024-12-10T20:15:00+09:00"
      }
    ],
    "created_at": "2024-12-10T18:30:00+09:00",
    "updated_at": "2024-12-10T20:15:00+09:00"
  }
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー
- 403: 権限エラー
- 404: 日報が見つからない

---

#### 日報作成
```http
POST /daily-reports
```

**リクエストボディ**
```json
{
  "report_date": "2024-12-10",
  "problem": "株式会社テストの契約更新について、価格調整の権限をどこまで持つべきか相談したい。",
  "plan": "・株式会社サンプルへの見積書作成\n・株式会社テストへの価格調整案の提示",
  "visit_records": [
    {
      "customer_id": 501,
      "visit_content": "新商品のプレゼンテーションを実施。",
      "visit_order": 1
    },
    {
      "customer_id": 502,
      "visit_content": "既存契約の更新について打ち合わせ。",
      "visit_order": 2
    }
  ]
}
```

**バリデーション**

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| report_date | ○ | date | 過去または今日の日付 |
| problem | - | string | 2000文字以内 |
| plan | - | string | 2000文字以内 |
| visit_records | ○ | array | 最低1件、最大50件 |
| visit_records[].customer_id | ○ | integer | 存在する顧客ID |
| visit_records[].visit_content | ○ | string | 1000文字以内 |
| visit_records[].visit_order | ○ | integer | 1以上 |

**レスポンス例**
```json
{
  "data": {
    "report_id": 1,
    "sales_id": 123,
    "report_date": "2024-12-10",
    "created_at": "2024-12-10T18:30:00+09:00"
  },
  "message": "日報を作成しました"
}
```

**ステータスコード**
- 201: 作成成功
- 400: バリデーションエラー
- 401: 認証エラー
- 409: 同一日の日報が既に存在

---

#### 日報更新
```http
PUT /daily-reports/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

**リクエストボディ**
```json
{
  "report_date": "2024-12-10",
  "problem": "更新された課題内容",
  "plan": "更新された計画内容",
  "visit_records": [
    {
      "visit_id": 101,
      "customer_id": 501,
      "visit_content": "更新された訪問内容",
      "visit_order": 1
    }
  ]
}
```

**バリデーション**
- 作成時と同様

**レスポンス例**
```json
{
  "data": {
    "report_id": 1,
    "updated_at": "2024-12-10T19:00:00+09:00"
  },
  "message": "日報を更新しました"
}
```

**ステータスコード**
- 200: 更新成功
- 400: バリデーションエラー
- 401: 認証エラー
- 403: 権限エラー（他人の日報は更新不可）
- 404: 日報が見つからない

---

#### 日報削除
```http
DELETE /daily-reports/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

**レスポンス例**
```json
{
  "message": "日報を削除しました"
}
```

**ステータスコード**
- 200: 削除成功
- 401: 認証エラー
- 403: 権限エラー
- 404: 日報が見つからない

---

#### 日報のコメント一覧取得
```http
GET /daily-reports/{id}/comments
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

**レスポンス例**
```json
{
  "data": [
    {
      "comment_id": 201,
      "report_id": 1,
      "commenter_id": 100,
      "commenter_name": "山田部長",
      "comment_content": "株式会社テストの件、最大10%までの値引きは承認します。",
      "created_at": "2024-12-10T20:15:00+09:00"
    }
  ]
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー
- 403: 権限エラー
- 404: 日報が見つからない

---

#### 日報にコメント追加
```http
POST /daily-reports/{id}/comments
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

**リクエストボディ**
```json
{
  "comment_content": "良い対応でした。引き続きよろしくお願いします。"
}
```

**バリデーション**

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| comment_content | ○ | string | 1000文字以内 |

**レスポンス例**
```json
{
  "data": {
    "comment_id": 202,
    "report_id": 1,
    "commenter_id": 100,
    "created_at": "2024-12-10T21:00:00+09:00"
  },
  "message": "コメントを追加しました"
}
```

**ステータスコード**
- 201: 作成成功
- 400: バリデーションエラー
- 401: 認証エラー
- 403: 権限エラー（上長のみコメント可能）
- 404: 日報が見つからない

---

### 訪問記録API

#### 訪問記録一覧取得
```http
GET /visit-records
```

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| report_id | integer | - | 日報ID |
| customer_id | integer | - | 顧客ID |
| start_date | date | - | 開始日 |
| end_date | date | - | 終了日 |

**レスポンス例**
```json
{
  "data": [
    {
      "visit_id": 101,
      "report_id": 1,
      "customer_id": 501,
      "customer_name": "株式会社サンプル",
      "visit_content": "新商品のプレゼンテーションを実施。",
      "visit_order": 1,
      "created_at": "2024-12-10T18:30:00+09:00"
    }
  ]
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー

---

### 顧客マスタAPI

#### 顧客一覧取得
```http
GET /customers
```

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| sales_id | integer | - | 担当営業ID |
| industry | string | - | 業種 |
| page | integer | - | ページ番号 |
| per_page | integer | - | 1ページあたりの件数 |

**レスポンス例**
```json
{
  "data": [
    {
      "customer_id": 501,
      "customer_name": "株式会社サンプル",
      "customer_name_kana": "カブシキガイシャサンプル",
      "industry": "製造業",
      "address": "東京都渋谷区...",
      "phone": "03-1234-5678",
      "sales_id": 123,
      "sales_name": "田中太郎",
      "created_at": "2024-01-01T00:00:00+09:00",
      "updated_at": "2024-12-01T10:00:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 10,
    "total_count": 195,
    "has_next": true,
    "has_prev": false
  }
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー

---

#### 顧客詳細取得
```http
GET /customers/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 顧客ID |

**レスポンス例**
```json
{
  "data": {
    "customer_id": 501,
    "customer_name": "株式会社サンプル",
    "customer_name_kana": "カブシキガイシャサンプル",
    "industry": "製造業",
    "postal_code": "150-0001",
    "address": "東京都渋谷区神宮前1-1-1",
    "phone": "03-1234-5678",
    "sales_id": 123,
    "sales_name": "田中太郎",
    "visit_count": 15,
    "last_visit_date": "2024-12-10",
    "created_at": "2024-01-01T00:00:00+09:00",
    "updated_at": "2024-12-01T10:00:00+09:00"
  }
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー
- 404: 顧客が見つからない

---

#### 顧客作成
```http
POST /customers
```

**リクエストボディ**
```json
{
  "customer_name": "株式会社サンプル",
  "customer_name_kana": "カブシキガイシャサンプル",
  "industry": "製造業",
  "postal_code": "150-0001",
  "address": "東京都渋谷区神宮前1-1-1",
  "phone": "03-1234-5678",
  "sales_id": 123
}
```

**バリデーション**

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| customer_name | ○ | string | 100文字以内 |
| customer_name_kana | ○ | string | 100文字以内、全角カタカナ |
| industry | ○ | string | 業種マスタから選択 |
| postal_code | - | string | 7桁の数字（ハイフン含む） |
| address | - | string | 200文字以内 |
| phone | - | string | 電話番号形式 |
| sales_id | ○ | integer | 存在する営業ID |

**レスポンス例**
```json
{
  "data": {
    "customer_id": 501,
    "customer_name": "株式会社サンプル",
    "created_at": "2024-12-10T18:30:00+09:00"
  },
  "message": "顧客を作成しました"
}
```

**ステータスコード**
- 201: 作成成功
- 400: バリデーションエラー
- 401: 認証エラー

---

#### 顧客更新
```http
PUT /customers/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 顧客ID |

**リクエストボディ**
- 顧客作成と同様

**レスポンス例**
```json
{
  "data": {
    "customer_id": 501,
    "updated_at": "2024-12-10T19:00:00+09:00"
  },
  "message": "顧客を更新しました"
}
```

**ステータスコード**
- 200: 更新成功
- 400: バリデーションエラー
- 401: 認証エラー
- 404: 顧客が見つからない

---

#### 顧客削除（論理削除）
```http
DELETE /customers/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 顧客ID |

**レスポンス例**
```json
{
  "message": "顧客を削除しました"
}
```

**ステータスコード**
- 200: 削除成功
- 401: 認証エラー
- 403: 権限エラー
- 404: 顧客が見つからない

---

#### 顧客検索
```http
GET /customers/search
```

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| q | string | ○ | 検索キーワード（顧客名、カナ） |
| industry | string | - | 業種 |
| sales_id | integer | - | 担当営業ID |

**レスポンス例**
```json
{
  "data": [
    {
      "customer_id": 501,
      "customer_name": "株式会社サンプル",
      "industry": "製造業",
      "sales_name": "田中太郎"
    }
  ]
}
```

**ステータスコード**
- 200: 成功
- 400: クエリパラメータエラー
- 401: 認証エラー

---

### 営業マスタAPI

#### 営業一覧取得
```http
GET /sales-persons
```

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| department | string | - | 所属部署 |
| manager_id | integer | - | 上長ID |
| page | integer | - | ページ番号 |
| per_page | integer | - | 1ページあたりの件数 |

**レスポンス例**
```json
{
  "data": [
    {
      "sales_id": 123,
      "sales_name": "田中太郎",
      "sales_name_kana": "タナカタロウ",
      "email": "tanaka@example.com",
      "department": "営業1課",
      "manager_id": 100,
      "manager_name": "山田部長",
      "created_at": "2024-01-01T00:00:00+09:00",
      "updated_at": "2024-12-01T10:00:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_count": 45,
    "has_next": true,
    "has_prev": false
  }
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー
- 403: 権限エラー（管理者のみ）

---

#### 営業詳細取得
```http
GET /sales-persons/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 営業ID |

**レスポンス例**
```json
{
  "data": {
    "sales_id": 123,
    "sales_name": "田中太郎",
    "sales_name_kana": "タナカタロウ",
    "email": "tanaka@example.com",
    "department": "営業1課",
    "manager_id": 100,
    "manager_name": "山田部長",
    "role": "sales",
    "report_count": 245,
    "customer_count": 32,
    "created_at": "2024-01-01T00:00:00+09:00",
    "updated_at": "2024-12-01T10:00:00+09:00"
  }
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー
- 404: 営業が見つからない

---

#### 営業作成
```http
POST /sales-persons
```

**リクエストボディ**
```json
{
  "sales_name": "田中太郎",
  "sales_name_kana": "タナカタロウ",
  "email": "tanaka@example.com",
  "password": "SecurePass123!",
  "department": "営業1課",
  "manager_id": 100,
  "role": "sales"
}
```

**バリデーション**

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| sales_name | ○ | string | 50文字以内 |
| sales_name_kana | ○ | string | 50文字以内、全角カタカナ |
| email | ○ | string | メール形式、重複不可 |
| password | ○ | string | 8文字以上、英数字記号混在 |
| department | ○ | string | 50文字以内 |
| manager_id | - | integer | 存在する営業ID |
| role | ○ | string | sales, manager, admin |

**レスポンス例**
```json
{
  "data": {
    "sales_id": 123,
    "sales_name": "田中太郎",
    "email": "tanaka@example.com",
    "created_at": "2024-12-10T18:30:00+09:00"
  },
  "message": "営業を作成しました"
}
```

**ステータスコード**
- 201: 作成成功
- 400: バリデーションエラー
- 401: 認証エラー
- 403: 権限エラー（管理者のみ）
- 409: メールアドレス重複

---

#### 営業更新
```http
PUT /sales-persons/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 営業ID |

**リクエストボディ**
```json
{
  "sales_name": "田中太郎",
  "sales_name_kana": "タナカタロウ",
  "email": "tanaka@example.com",
  "password": "NewPassword123!",
  "department": "営業2課",
  "manager_id": 101,
  "role": "manager"
}
```

※ passwordは変更する場合のみ指定

**レスポンス例**
```json
{
  "data": {
    "sales_id": 123,
    "updated_at": "2024-12-10T19:00:00+09:00"
  },
  "message": "営業を更新しました"
}
```

**ステータスコード**
- 200: 更新成功
- 400: バリデーションエラー
- 401: 認証エラー
- 403: 権限エラー
- 404: 営業が見つからない

---

#### 営業削除（論理削除）
```http
DELETE /sales-persons/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 営業ID |

**レスポンス例**
```json
{
  "message": "営業を削除しました"
}
```

**ステータスコード**
- 200: 削除成功
- 401: 認証エラー
- 403: 権限エラー（管理者のみ）
- 404: 営業が見つからない

---

#### 部下一覧取得
```http
GET /sales-persons/{id}/subordinates
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 営業ID（上長） |

**レスポンス例**
```json
{
  "data": [
    {
      "sales_id": 123,
      "sales_name": "田中太郎",
      "department": "営業1課",
      "email": "tanaka@example.com"
    },
    {
      "sales_id": 124,
      "sales_name": "佐藤花子",
      "department": "営業1課",
      "email": "sato@example.com"
    }
  ]
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー
- 404: 営業が見つからない

---

### コメントAPI

#### コメント更新
```http
PUT /comments/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | コメントID |

**リクエストボディ**
```json
{
  "comment_content": "更新されたコメント内容"
}
```

**レスポンス例**
```json
{
  "data": {
    "comment_id": 201,
    "updated_at": "2024-12-10T21:30:00+09:00"
  },
  "message": "コメントを更新しました"
}
```

**ステータスコード**
- 200: 更新成功
- 400: バリデーションエラー
- 401: 認証エラー
- 403: 権限エラー（本人のみ更新可能）
- 404: コメントが見つからない

---

#### コメント削除
```http
DELETE /comments/{id}
```

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | コメントID |

**レスポンス例**
```json
{
  "message": "コメントを削除しました"
}
```

**ステータスコード**
- 200: 削除成功
- 401: 認証エラー
- 403: 権限エラー（本人のみ削除可能）
- 404: コメントが見つからない

---

### ダッシュボードAPI

#### ダッシュボード概要取得
```http
GET /dashboard/summary
```

**レスポンス例**
```json
{
  "data": {
    "user": {
      "sales_id": 123,
      "sales_name": "田中太郎",
      "department": "営業1課",
      "role": "sales"
    },
    "statistics": {
      "today_reports": 1,
      "this_week_reports": 5,
      "this_month_reports": 20,
      "total_customers": 32,
      "this_month_visits": 65
    },
    "recent_reports": [
      {
        "report_id": 1,
        "report_date": "2024-12-10",
        "visit_count": 3,
        "unread_comment_count": 1
      }
    ],
    "pending_comments": 3
  }
}
```

**ステータスコード**
- 200: 成功
- 401: 認証エラー

---

#### 通知一覧取得
```http
GET /dashboard/notifications
```

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| unread_only | boolean | - | 未読のみ取得 |
| page | integer | - | ページ番号 |
| per_page | integer | - | 1ページあたりの件数 |

**レスポンス例**
```json
{
  "data": [
    {
      "notification_id": 1,
      "type": "new_comment",
      "title": "新しいコメントがあります",
      "message": "山田部長があなたの日報にコメントしました",
      "related_id": 1,
      "related_type": "daily_report",
      "is_read": false,
      "created_at": "2024-12-10T20:15:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 2,
    "total_count": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

**通知タイプ**
- `new_comment`: 新しいコメント
- `report_reminder`: 日報未提出リマインダー
- `mention`: メンション通知

**ステータスコード**
- 200: 成功
- 401: 認証エラー

---

## エラーコード

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功（取得、更新、削除） |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 401 | 認証エラー（トークン無効または期限切れ） |
| 403 | 権限エラー（アクセス権限なし） |
| 404 | リソースが見つからない |
| 409 | 競合エラー（重複など） |
| 422 | 処理不可能なエンティティ |
| 500 | サーバー内部エラー |
| 503 | サービス利用不可 |

### アプリケーションエラーコード

| コード | 説明 |
|--------|------|
| AUTH_001 | 認証に失敗しました |
| AUTH_002 | トークンが無効です |
| AUTH_003 | トークンの有効期限が切れています |
| AUTH_004 | 権限がありません |
| VAL_001 | 入力値が不正です |
| VAL_002 | 必須項目が入力されていません |
| VAL_003 | 文字数制限を超えています |
| VAL_004 | フォーマットが正しくありません |
| RES_001 | リソースが見つかりません |
| RES_002 | リソースが既に存在します |
| BIZ_001 | 同一日の日報が既に存在します |
| BIZ_002 | 訪問記録が最低1件必要です |
| BIZ_003 | 他人の日報は編集できません |
| BIZ_004 | 上長のみコメント可能です |
| SYS_001 | システムエラーが発生しました |
| SYS_002 | データベース接続エラー |

### エラーレスポンス例

#### バリデーションエラー
```json
{
  "error": {
    "code": "VAL_001",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "メールアドレスの形式が正しくありません"
      },
      {
        "field": "visit_records",
        "message": "訪問記録を最低1件は登録してください"
      }
    ]
  }
}
```

#### 認証エラー
```json
{
  "error": {
    "code": "AUTH_003",
    "message": "トークンの有効期限が切れています"
  }
}
```

#### リソース未検出エラー
```json
{
  "error": {
    "code": "RES_001",
    "message": "指定された日報が見つかりません"
  }
}
```

---

## レート制限

### 制限値
- 認証済みユーザー: 1000リクエスト/時間
- 未認証: 100リクエスト/時間

### レスポンスヘッダー
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1702281600
```

### レート制限超過時
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
```

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "リクエスト制限を超えました。1時間後に再試行してください。"
  }
}
```

---

## バージョニング

### URL方式
```
https://api.example.com/v1/daily-reports
https://api.example.com/v2/daily-reports
```

### 互換性ポリシー
- マイナーバージョンアップ: 後方互換性を保持
- メジャーバージョンアップ: 破壊的変更を含む可能性あり
- 旧バージョンは最低6ヶ月間サポート

---

## セキュリティ

### HTTPS必須
全てのAPIエンドポイントはHTTPSでのみアクセス可能

### CORS設定
```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### CSRFトークン
状態を変更するリクエスト（POST, PUT, DELETE）にはCSRFトークンが必要

```http
X-CSRF-Token: {csrf_token}
```

### IPホワイトリスト
管理者APIエンドポイントは特定IPからのみアクセス可能（オプション）

---

## 改訂履歴

| 版数 | 改訂日 | 改訂内容 | 作成者 |
|------|--------|----------|--------|
| 1.0 | 2024/12/10 | 初版作成 | - |

