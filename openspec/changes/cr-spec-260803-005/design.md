## Context

`cr-spec-260803-003` 完成了頭像上傳的完整程式碼實作，但當時明確排除「取得真實 R2 金鑰」的範圍，`.env.example` 沿用的是姊妹專案 bc-erp 共用的舊 bucket 名稱（`bc-erp-attachments`），本機 `.env` 裡的 R2 相關變數也維持註解停用狀態（見下方「目前 `.env` 現況」）。提出人現已在 Cloudflare 建立好 project_a 專屬的正式（`project-a`）與開發（`project-a-dev`）兩個 bucket，本次僅需要把這兩組實際值正確接上專案設定。

**目前 `.env` 現況**（已用 `grep` 確認）：
```
# R2_ACCOUNT_ID="ebf85e9a2acef881255d1a5ecf616b7e"
# R2_ACCESS_KEY_ID="2b9fe638608dd2378edde5ca2220d7dc"
# R2_SECRET_ACCESS_KEY="b3c1d4c4d1f412dfea03251e7acbfa8d1d9d7ffe232dc1f5224a5c5f08ded6de"
# R2_BUCKET_NAME="bc-erp-projects"
# R2_ENDPOINT="https://ebf85e9a2acef881255d1a5ecf616b7e.r2.cloudflarestorage.com"
```
帳號 ID（`ebf85e9a2acef881255d1a5ecf616b7e`）與本次提供的兩個新 bucket 相同，代表這是同一個 Cloudflare 帳號；但 `R2_BUCKET_NAME` 是共用的 `bc-erp-projects`，且整組設定目前是停用（註解）狀態，`R2_PUBLIC_URL` 未曾出現過。

`lib/storage/r2.ts`（`cr-spec-260803-003` 已完成）直接讀取 `R2_ENDPOINT`／`R2_BUCKET_NAME`／`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`／`R2_PUBLIC_URL` 這幾個環境變數，不做任何依環境切換 bucket 的邏輯——這與專案既有的 `DATABASE_URL_DEV`／`DATABASE_URL_VPS3`（同一份 `.env` 內並存兩組、由 Makefile 指令選擇使用哪一組）模式不同。R2 不需要比照辦理，因為應用程式在任一時刻只會連向一個部署環境（本機開發 or 正式站），各自的 `.env` 本來就是分開管理、彼此獨立的檔案，天然對應到各自的 bucket，不需要程式碼層面的雙變數切換邏輯。

## Goals / Non-Goals

**Goals:**
- `.env.example` 的 R2 設定範例值與註解正確反映「project_a 依環境各自使用專屬 bucket」的實際命名慣例。
- 本機開發 `.env` 的 R2 變數啟用並指向 `project-a-dev`（開發 bucket），讓本機驗證頭像上傳功能時能實際打到 R2。
- 記錄正式環境（`project-a` bucket）應使用的值，供日後部署 GCP 正式站時設定參考。

**Non-Goals:**
- 不取得或決定 `R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY` 的真實值——是否可沿用目前已停用的帳號層級金鑰、或需要為新 bucket 另外核發，屬於提出人於 Cloudflare 後台的判斷範圍，見下方 Open Questions。
- 不修改 `lib/storage/r2.ts` 或任何讀取這些環境變數的應用程式碼——現有實作已經是「讀環境變數、不寫死 bucket 名稱」，天然相容本次的設定調整，不需要程式碼異動。
- 不處理 GCP 正式站部署設定的實際套用動作（不在此 repo 管轄範圍）。

## Decisions

### 沿用單一組環境變數名稱，不新增 dev/prod 兩組變數
維持 `R2_ACCOUNT_ID`／`R2_BUCKET_NAME`／`R2_ENDPOINT`／`R2_PUBLIC_URL`（不新增如 `R2_BUCKET_NAME_DEV`／`R2_BUCKET_NAME_PROD` 這類雙變數命名），理由如上述 Context：R2 存取不像資料庫遷移指令需要在同一個執行環境切換不同目標，每個部署環境本來就各自維護獨立的 `.env`，讓同一組變數名稱在不同環境的 `.env` 檔裡填不同值即可，符合 12-factor 慣例、也與目前程式碼零異動。

### `.env.example` 範例值改用開發 bucket（`project-a-dev`）而非正式 bucket
`.env.example` 是給開發者複製建立本機 `.env` 的起點，範例值使用開發 bucket 較符合直覺（避免有人誤把正式 bucket 名稱複製進本機環境）；正式 bucket 的值另外以註解形式記錄在同一區塊，供部署時參考複製。

## Risks / Trade-offs

- [風險] 帳號層級金鑰（`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`）是否對新建立的 `project-a`／`project-a-dev` bucket 有存取權限尚未確認，若金鑰是綁定舊 bucket（`bc-erp-projects`）或已停用，直接沿用會導致上傳/刪除 API 呼叫失敗（401/403）→ Mitigation：tasks 中明確列出「向提出人確認金鑰是否可直接沿用」的步驟，若不行則此 CR 完成後金鑰欄位仍維持待填，不阻擋其餘設定先行更新。
  - **實作階段更新（cr-apply）**：此風險已實際發生並排除。提出人於實作前確認「金鑰可直接沿用」，但實測上傳頭像時 R2 回傳 `AccessDenied`；判斷原 token 建立時綁定了特定 bucket（僅涵蓋舊的 `bc-erp-projects`），並非真正的帳號層級全 bucket 權限。提出人隨後於 Cloudflare 後台核發新的 API token（涵蓋新 bucket），更新 `.env` 並重建容器後，上傳／更換／移除頭像三個動作皆實測通過，並以 S3 `ListObjectsV2` 直接查詢 bucket 確認無殘留物件。**經驗記錄**：日後在 Cloudflare R2 建立新 bucket 時，若沿用既有 API token，需額外確認該 token 的權限範圍是否有涵蓋新 bucket，不能僅憑帳號 ID 相同就假設權限也涵蓋。
- [風險] `.env` 為未受版控（`.gitignore`）的本機檔案，`/cr-apply` 對它的修改不會被 git 追蹤、也不會出現在 commit diff 中，日後難以單純從 git 歷史回溯這次設定變更 → Mitigation：`.env.example` 的對應更新會被 git 追蹤，作為這次變更的可稽核紀錄；`.env` 本身的實際修改內容已完整記錄於本 design.md。
