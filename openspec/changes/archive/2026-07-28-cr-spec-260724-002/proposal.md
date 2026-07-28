## Why

正式環境重新部署（重建 `project-a-web` 容器）時，若使用者的分頁停留在部署前的舊版本，之後點擊送出會呼叫舊版編譯出的 Server Action ID，新版伺服器找不到對應 handler，直接在框架層拋出 `Failed to find Server Action ... This request might be from an older or newer deployment.`。目前全站呼叫 Server Action 的表單（約 32 處元件）皆未包 try/catch，僅單純判斷 `result.success`，一旦框架層拋錯即成為未處理的 rejection：畫面沒有任何提示、loading 狀態不會重置，使用者以為已送出成功，內容卻從未寫入資料庫。此問題已於 2026-07-24 造成學員徐正容兩則「聯繫管理者」提問實際遺失（正式站 `support_inquiries` 表 id 序號出現 8、11、12 三個空缺，對應三次送出從未成功寫入），且事後管理者、學員雙方皆無法察覺與追查。

## What Changes

- 新增共用機制，偵測 Server Action 呼叫因部署版本不符而拋出的錯誤，攔截後以明確提示引導使用者「頁面已更新，請重新整理後再次送出」，避免內容在無感知的情況下遺失
- 「聯繫管理者」提問送出（`submitInquiry` / `support-inquiry-form.tsx`）改用此共用機制，作為本次事故的直接修復對象
- 共用機制以獨立、可重用的方式建立（例如 hook 或 utility），供其餘約 32 處呼叫 Server Action 的表單於後續 change 逐步導入，本次不強制一次全面遷移
- 新增正式環境資料庫定期備份機制（GCP 主機目前完全沒有自動備份，`make db-backup` 僅為本機開發用），每 6 小時執行一次 `pg_dump` 邏輯備份並套用保留政策，作為本次事故「資料一旦遺失即無法復原」這個根本缺口的補強

## Capabilities

### New Capabilities
- `server-action-resilience`: 提供共用機制偵測 Server Action 因正式環境重新部署造成的版本不符錯誤，並在偵測到時以明確提示引導使用者重新整理頁面後再次送出
- `prod-db-backup`: 正式環境資料庫定期備份機制，每 6 小時自動執行邏輯備份並依保留政策清理舊檔，提供資料遺失事故的復原依據

### Modified Capabilities
- `contact-admin`: 提問送出流程（`submitInquiry`）需採用 `server-action-resilience` 機制處理版本不符錯誤並給予使用者明確提示，取代目前完全無錯誤處理、失敗時無任何回饋的行為

## Impact

- 新增共用 hook/utility 檔案（實作方式於 design.md 決定），不涉及資料庫 schema 變更
- 修改 `components/support-inquiry/support-inquiry-form.tsx`、`app/actions/support-inquiry.ts`（如需調整錯誤傳遞方式）
- 全站約 32 個元件（`components/admin/*`、`course-catalog`、`course-faq`、`course-invite`、`course-session/*`、`notification` 等）現行皆為同樣「無 try/catch」呼叫模式，屬潛在風險範圍，但本次僅修復「聯繫管理者」這個已實際發生資料遺失的案例，其餘表單留待後續 change 導入
- 徐正容已遺失的兩則提問內容無法復原，需由管理者另行聯繫學員請其知悉並重新提問（此為事故善後，非本 change 範圍內的系統變更）
- 新增備份腳本與排程設定於 GCP 主機（`/home/ubuntu/vps-sn/postgres/` 下），不涉及本專案程式碼；GCP 主機目前未安裝 `cron` 套件，排程改以 systemd timer 實作
