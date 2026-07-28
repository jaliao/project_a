## 1. Server Action 版本不符偵測機制

- [x] 1.1 建立 `lib/utils/server-action-error.ts`，實作 `isDeploymentMismatchError(error: unknown): boolean`
- [x] 1.2 新增 i18n key（實作時改用 `supportInquiry` 命名空間以貼合元件既有的 `useTranslations('supportInquiry')` 慣例，未沿用 design.md 原先建議的 `common`：`deploymentMismatch`、`refreshPage`；一般錯誤沿用既有 `submitFail`，未新增 `unexpectedError`），並補上 `messages/en.json`、重新產生 `messages/zh-CN.json`

## 2. 聯繫管理者提問表單整合

- [x] 2.1 `components/support-inquiry/support-inquiry-form.tsx` 呼叫 `submitInquiry` 改為 try/catch，導入 `isDeploymentMismatchError` 判斷；命中時以 `sonner` 顯示提示並帶重新整理 action 按鈕（`onClick: () => window.location.reload()`），未命中則走既有一般錯誤提示
- [x] 2.2 新增表單草稿 `sessionStorage` 暫存：欄位（分類、內容）變更時寫入、元件掛載時還原、送出成功後清除；課程頁 Dialog 依 `courseInviteId` 區分 key，個人頁卡片與我的提問頁為同類一般提問共用同一 key
- [x] 2.3 確認三處使用場景（`contact-admin-cards.tsx`、`inquiries/page.tsx`、`contact-admin-dialog.tsx`）皆呼叫同一份 `support-inquiry-form.tsx` 元件，本次改動對三者皆生效，無例外呼叫路徑

## 3. 正式環境資料庫定期備份

- [x] 3.1 於 GCP 主機（`/home/ubuntu/vps-sn/postgres/`）撰寫 `backup.sh`：`docker exec postgres_db pg_dump` + `gzip` 輸出至 `backups/backup_<timestamp>.sql.gz`，`set -euo pipefail`
- [x] 3.2 於 `backup.sh` 加入保留政策清理邏輯：近 2 天全留、2–14 天每日僅留 1 份、超過 14 天刪除
- [x] 3.3 建立 systemd unit：`pg-backup.service`（執行 `backup.sh`）與 `pg-backup.timer`（`OnCalendar=00/6:00:00`）
- [x] 3.4 `systemctl enable --now pg-backup.timer`，並以 `systemctl list-timers` 確認排程已生效（下次觸發 2026-07-24 12:00 UTC）
- [x] 3.5 手動觸發備份，還原到 `restore_test` 測試資料庫驗證：22 個 table、`support_inquiries` 10 筆皆與正式站一致，還原後即刪除測試資料庫
- [x] 3.6 以假時間戳記檔案（20 天前、10 天前×2 同日、1 天前）實測清理邏輯：超過 14 天的刪除、同日僅留最早一份、2 天內全留，結果與預期完全相符；測試檔案已清除，僅留一份真實驗證用備份

## 4. 驗證與收尾

- [x] 4.1 `npm run lint`、`npm run build`：0 error（既有 16 個警告與本次改動無關）、build 成功
- [x] 4.2 以 Playwright 啟動本機開發環境（`make dev` 對應的 db+web 容器）實際登入操作驗證：①填寫表單→重新整理頁面→草稿正確還原（分類、內容皆帶回）→送出成功→草稿清除且真的寫入 DB；②攔截 fetch 丟出與正式站事故 log 完全一致的錯誤訊息，確認顯示「頁面已更新，請重新整理後再試一次」toast 並帶「重新整理」按鈕，與 design 一致
- [x] 4.3 `config/version.json`：`0.1.153` → `0.1.154`，`updatedAt` → `2026-07-24`
- [x] 4.4 檢查三份操作手冊：`doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md` 皆只描述「填分類＋內容＋送出」的正常流程，本次改動未變更任何按鈕/流程/權限/路由，僅新增錯誤情境下的提示與草稿保留（正常操作無感知），確認不需更新
