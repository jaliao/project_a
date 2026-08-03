## ADDED Requirements

### Requirement: 環境變數設定
系統 SHALL 依部署環境（開發／正式）分別讀取對應的 project_a 專屬 R2 bucket 設定（`R2_ACCOUNT_ID`／`R2_BUCKET_NAME`／`R2_ENDPOINT`／`R2_PUBLIC_URL`），不共用姊妹專案（bc-erp）的 bucket。

#### Scenario: 開發環境指向開發 bucket
- **WHEN** 本機開發環境的 `.env` 設定 R2 相關環境變數
- **THEN** `R2_BUCKET_NAME` SHALL 為開發專屬 bucket（`project-a-dev`），上傳/刪除頭像的 R2 API 呼叫皆作用於該 bucket

#### Scenario: 正式環境指向正式 bucket
- **WHEN** 正式站環境的環境變數設定 R2 相關變數
- **THEN** `R2_BUCKET_NAME` SHALL 為正式專屬 bucket（`project-a`），與開發環境的 bucket 彼此獨立、不互相寫入

#### Scenario: 環境變數未設定時上傳功能無法運作
- **WHEN** R2 相關環境變數缺漏或未正確設定
- **THEN** 上傳/刪除頭像的 R2 API 呼叫失敗，系統不應假設固定的預設 bucket 名稱
