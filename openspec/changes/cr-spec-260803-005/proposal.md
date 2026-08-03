## Why

`cr-spec-260803-003`（頭像上傳功能）當時明確將「取得/設定真實 R2 帳號金鑰」列為 Non-Goal，交由提出人（Justin）自行至 Cloudflare 後台申請並填入 `.env`；`.env.example` 當時沿用的仍是與姊妹專案 bc-erp 共用的舊 bucket 命名（`bc-erp-attachments`），並非「新建一個 project_a 專屬 bucket」的決策成果。提出人現已在 Cloudflare 建立好 project_a 專屬的正式與開發兩個 bucket，本次 CR 提供實際的 bucket 名稱、endpoint 與公開讀取網域，需要據此更新專案的環境變數設定，讓頭像上傳功能得以在對應環境實際運作。

## What Changes

- 建立完成兩個 project_a 專屬 R2 bucket：
  - 正式：`project-a`，endpoint `https://ebf85e9a2acef881255d1a5ecf616b7e.r2.cloudflarestorage.com/project-a`，公開網域 `https://pub-51e8bf5fbe62472484f2d23d08f47858.r2.dev`
  - 開發：`project-a-dev`，endpoint `https://ebf85e9a2acef881255d1a5ecf616b7e.r2.cloudflarestorage.com/project-a-dev`，公開網域 `https://pub-f09e84a76009402fb119509719c2bc87.r2.dev`
- `.env.example` 的 R2 設定範例值 SHALL 更新為反映「project_a 依環境各自使用專屬 bucket」的實際命名慣例（開發環境用 `project-a-dev`、正式環境用 `project-a`），取代目前仍殘留、語意錯誤的共用 bucket 名稱（`bc-erp-attachments`）。
- 本機開發用 `.env` 的 R2 相關變數（`R2_ACCOUNT_ID`／`R2_BUCKET_NAME`／`R2_ENDPOINT`／`R2_PUBLIC_URL`）SHALL 取消註解並填入 `project-a-dev`（開發 bucket）對應的實際值，讓本機開發環境的頭像上傳功能可實際呼叫 R2。
- 正式環境（GCP）的 `.env` 設定不在本次 CR 的程式碼變更範圍內（該環境的環境變數由部署時另行設定，非存放於此 repo），僅在 `.env.example`／文件中記錄正式 bucket 應使用的值供部署時參考。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `user-avatar`：新增一則「環境變數設定」需求，明確規範 R2 bucket 設定 SHALL 依部署環境（開發／正式）各自指向對應的 project_a 專屬 bucket；既有的上傳/移除/顯示 fallback 等行為契約不變

## Impact

- **環境變數**：`.env.example` 更新 `R2_ACCOUNT_ID`／`R2_BUCKET_NAME`／`R2_ENDPOINT`／`R2_PUBLIC_URL` 的範例值與註解說明；本機 `.env` 取消註解並填入開發 bucket（`project-a-dev`）對應值。
- **不修改任何應用程式碼**：`lib/storage/r2.ts`（讀取環境變數的方式）、`lib/utils/avatar.ts`、`app/actions/avatar.ts` 等既有邏輯已在 `cr-spec-260803-003` 完成，本次不需異動，純粹是環境變數層級的設定補齊。
- **不涉及**：`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY` 真實金鑰的取得或填入——沿用 `cr-spec-260803-003` 已確認的決策，金鑰由提出人自行至 Cloudflare 後台取得並填入，不在本次 CR 的實作範圍內（若 `.env` 中既有的（已停用的）金鑰是帳號層級、可直接沿用於新 bucket，將於 tasks 中請提出人確認後決定是否直接啟用；若需重新核發 bucket 專屬金鑰，則此 CR 完成後金鑰欄位仍會維持待填狀態）。

## Non-Goals

- 不取得或設定 `R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY` 真實金鑰（沿用 `cr-spec-260803-003` 既有決策）。
- 不異動任何應用程式碼邏輯（`lib/storage/r2.ts` 等既有實作已可直接讀取新的環境變數值，無需修改）。
- 不處理正式環境（GCP）部署設定的實際套用，僅記錄正式環境應使用的值供日後部署參考。
