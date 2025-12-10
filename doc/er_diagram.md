erDiagram
    SalesPerson ||--o{ DailyReport : "作成する"
    SalesPerson ||--o{ Comment : "コメントする"
    SalesPerson ||--o{ Customer : "担当する"
    SalesPerson ||--o{ SalesPerson : "上長として管理する"
    
    DailyReport ||--|{ VisitRecord : "含む"
    DailyReport ||--o{ Comment : "受ける"
    
    Customer ||--o{ VisitRecord : "訪問される"
    
    SalesPerson {
        int sales_id PK "営業ID"
        string sales_name "営業名"
        string sales_name_kana "営業名カナ"
        string email "メールアドレス"
        string department "所属部署"
        int manager_id FK "上長ID"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
        boolean is_deleted "削除フラグ"
    }
    
    DailyReport {
        int report_id PK "日報ID"
        int sales_id FK "営業ID"
        date report_date "報告日"
        text problem "課題・相談"
        text plan "明日の計画"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }
    
    VisitRecord {
        int visit_id PK "訪問記録ID"
        int report_id FK "日報ID"
        int customer_id FK "顧客ID"
        text visit_content "訪問内容"
        int visit_order "訪問順序"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }
    
    Comment {
        int comment_id PK "コメントID"
        int report_id FK "日報ID"
        int commenter_id FK "コメント者ID"
        text comment_content "コメント内容"
        datetime created_at "作成日時"
    }
    
    Customer {
        int customer_id PK "顧客ID"
        string customer_name "顧客名"
        string customer_name_kana "顧客名カナ"
        string industry "業種"
        string address "住所"
        string phone "電話番号"
        int sales_id FK "担当営業ID"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
        boolean is_deleted "削除フラグ"
    }

補足説明
リレーションシップ

営業（SalesPerson）↔ 日報（DailyReport）: 1:N

1人の営業が複数の日報を作成


日報（DailyReport）↔ 訪問記録（VisitRecord）: 1:N

1つの日報に複数の訪問記録を登録可能


顧客（Customer）↔ 訪問記録（VisitRecord）: 1:N

1つの顧客が複数回訪問される


日報（DailyReport）↔ コメント（Comment）: 1:N

1つの日報に複数のコメントが可能


営業（SalesPerson）自己参照

上長管理のための自己参照関係
