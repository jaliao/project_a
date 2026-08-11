## 1. `.env.example` 更新

- [x] 1.1 `R2_BUCKET_NAME` 範例值由 `bc-erp-attachments` 改為 `project-a-dev`（開發環境範例）
- [x] 1.2 `R2_ENDPOINT` 範例值改為 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`（維持既有的 placeholder 寫法，帳號 ID 不寫死在 `.env.example`）
- [x] 1.3 `R2_PUBLIC_URL` 補上實際範例格式，並於註解中同時列出正式／開發兩組公開網域（`https://pub-51e8bf5fbe62472484f2d23d08f47858.r2.dev`＝正式 `project-a`、`https://pub-f09e84a76009402fb119509719c2bc87.r2.dev`＝開發 `project-a-dev`），供部署時對照複製
- [x] 1.4 新增註解說明「project_a 依環境使用專屬 bucket（開發 `project-a-dev`／正式 `project-a`），不與 bc-erp 共用」

## 2. 本機開發環境啟用

- [x] 2.1 向提出人確認 `.env` 中目前已停用（註解）的帳號層級金鑰（`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`）是否可直接沿用於新建立的 `project-a-dev`／`project-a` bucket；若否，取得新核發的金鑰。提出人確認：帳號層級金鑰，可直接沿用
- [x] 2.2 本機 `.env` 取消 R2 相關變數的註解，`R2_ACCOUNT_ID` 維持 `ebf85e9a2acef881255d1a5ecf616b7e`（帳號不變）
- [x] 2.3 `.env` 的 `R2_BUCKET_NAME` 改為 `project-a-dev`、`R2_ENDPOINT` 改為 `https://ebf85e9a2acef881255d1a5ecf616b7e.r2.cloudflarestorage.com`（S3 API 呼叫用，`Bucket` 參數另由 `R2_BUCKET_NAME` 指定，`ENDPOINT` 本身不含 bucket 路徑）
- [x] 2.4 `.env` 新增 `R2_PUBLIC_URL="https://pub-f09e84a76009402fb119509719c2bc87.r2.dev"`（開發 bucket 公開網域）

## 3. 驗證

- [x] 3.1 重新啟動本機 Next.js dev server（載入新的環境變數）。實際上 `docker restart` 不會重新套用 `env_file`，改用 `docker compose up -d --force-recreate --no-deps web` 重建容器，已用 `docker exec ... printenv` 確認新的 R2_* 變數確實載入容器內
- [x] 3.2 提出人於 Cloudflare 後台核發新的 API token（新 Access Key ID／Secret，涵蓋新 bucket 權限）並提供，已更新 `.env` 後重建容器。實測於 `/profile` 上傳頭像成功：`uploadAvatar` 呼叫 R2 API 無錯誤，回應圖片網址 `https://pub-f09e84a76009402fb119509719c2bc87.r2.dev/avatars/{userId}/{uuid}.png`，以 `page.request.get` 直接對該網址發請求回傳 200，圖片可正常存取
- [x] 3.3 更換頭像（再次上傳），並以 S3 `ListObjectsV2Command` 直接查詢 `project-a-dev` bucket 的 `avatars/` 前綴，確認舊物件未累積（見 3.5 的查詢結果）
- [x] 3.4 移除頭像，UI 顯示「頭像已移除」成功提示，`avatarKey` 清空後「移除頭像」按鈕消失（畫面回退至無自訂頭像的 fallback 狀態）
- [x] 3.5 用相同的新金鑰直接查詢 `project-a-dev` bucket（`ListObjectsV2Command`，Prefix `avatars/`），完整跑完「上傳→更換→移除」後查詢結果為 0 筆物件，證實上傳/更換時的舊物件刪除、移除時的物件刪除皆正確執行，對應 spec 的「環境變數設定」與 `cr-spec-260803-003` 既有的上傳/移除 Scenario 皆通過

**3.2 卡點排除記錄**：原帳號層級金鑰對新 bucket 回傳 `AccessDenied`（判斷為該 token 建立時綁定特定 bucket、未涵蓋新 bucket）；提出人核發新 token 後問題排除，不需修改任何應用程式碼。

## 4. 文件記錄

- [x] 4.1 正式環境（`project-a` bucket）應使用的實際值已記錄於 proposal.md「What Changes」與 design.md「Context」：`R2_BUCKET_NAME="project-a"`、`R2_ENDPOINT="https://ebf85e9a2acef881255d1a5ecf616b7e.r2.cloudflarestorage.com"`、`R2_PUBLIC_URL="https://pub-51e8bf5fbe62472484f2d23d08f47858.r2.dev"`，`R2_ACCOUNT_ID` 與 access key/secret 沿用同一帳號（待 3.2 的權限問題排除後一併確認）
