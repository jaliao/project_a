## Context

2026-07-24 正式站因記憶體不足重建 `project-a-web` 容器，期間仍停留在舊版分頁的使用者送出表單時，Next.js Server Action 因版本不符直接在框架層拋出 `Failed to find Server Action "...". This request might be from an older or newer deployment.`。目前全站呼叫 `app/actions/*` 的表單（約 32 處元件，含 `components/support-inquiry/support-inquiry-form.tsx`）皆是單純 `const result = await someAction(...)` 後判斷 `result.success`，完全沒有 try/catch；框架拋出的錯誤因此成為未處理的 rejection：畫面無提示、loading 狀態不會重置，使用者以為已送出成功，內容卻從未寫入資料庫。此事故已造成學員徐正容兩則提問實際遺失且雙方皆無法察覺。

自架環境（非 Vercel）沒有官方的 Server Actions Skew Protection 機制，重新部署當下必然會有短暫窗口讓舊分頁的請求打到新版伺服器並失敗；本設計聚焦於「偵測到此情況時給使用者清楚且可行動的提示」，而非消除該時間窗口本身。

## Goals / Non-Goals

**Goals:**
- 偵測 Server Action 因部署版本不符拋出的錯誤，避免變成未處理的 rejection
- 偵測到時，以明確提示告知使用者「頁面已更新，請重新整理後再試一次」，並提供可直接執行的動作（重新整理按鈕）
- 「聯繫管理者」提問表單在此情境下，使用者已輸入的內容不因整頁重新整理而遺失
- 提供集中、可重用的偵測工具（utility），供其餘表單日後以相同 try/catch pattern 採用
- 正式環境資料庫每 6 小時自動備份，讓「資料一旦遺失即無法復原」不再是唯一結果

**Non-Goals:**
- 不消除部署當下必然存在的短暫版本不符窗口（自架環境無 Vercel Skew Protection 可用）
- 不在本次一次全面遷移全站約 32 處呼叫 Server Action 的表單，僅示範套用於 `contact-admin`（提問送出）
- 不復原徐正容已遺失的兩則歷史提問資料（純資料事故善後，非系統變更範圍）
- 不引入通用的 `useServerAction` hook 或表單持久化框架；維持與現有表單一致的直接呼叫慣例，僅新增 try/catch 與偵測 utility
- 不建置異地/雲端儲存備份（如同步到 VPS3 或物件儲存），本次僅解決「完全沒有備份」的問題，備份檔仍存於 GCP 主機本機磁碟；異地備援留待後續 change 評估

## Decisions

**1. 偵測方式：字串比對錯誤訊息**
新增 `lib/utils/server-action-error.ts`，匯出 `isDeploymentMismatchError(error: unknown): boolean`，判斷 `error instanceof Error` 且訊息符合 `Failed to find Server Action` / `older or newer deployment`。
理由：Next.js 16.1.1 目前未提供自架環境可辨識此情境的錯誤類型或 digest（官方 Skew Protection 僅 Vercel 平台提供），字串比對是目前唯一可行做法。集中成單一 utility，未來 Next.js 版本升級若措辭改變，只需修改一處。

**2. 呼叫端模式：表單層級 try/catch，不包裝成 hook**
`support-inquiry-form.tsx` 改為：
```ts
try {
  const result = await submitInquiry(payload)
  // 既有 result.success 分支邏輯不變
} catch (error) {
  if (isDeploymentMismatchError(error)) {
    toast.error(t('common.deploymentMismatch'), {
      action: { label: t('common.refreshPage'), onClick: () => window.location.reload() },
    })
  } else {
    toast.error(t('common.unexpectedError'))
  }
}
```
理由：維持與其他表單一致的直接呼叫慣例，不引入額外的 hook/狀態管理抽象；其餘表單日後可直接複製此 pattern，改動成本低。

**3. 錯誤提示走既有 i18n 規範**
文案新增至 `messages/zh-TW.json`（`common.deploymentMismatch`、`common.refreshPage`、`common.unexpectedError`，視既有 key 是否已存在而定）並補 `messages/en.json`，不寫死中文；toast 使用既有 `sonner`（`toast.error` 支援 `action` 參數）。

**4. 表單草稿暫存於 `sessionStorage`**
`support-inquiry-form.tsx` 於分類、內容欄位變更時，將目前值同步寫入 `sessionStorage`（key 依表單所在情境區分，如個人頁卡片表單 vs 課程頁 Dialog）；表單掛載時若存在草稿則自動還原；送出成功後主動清除。
理由：直接處理本次事故最痛的點——使用者輸入內容遺失。重新整理是偵測到版本不符後的必要動作（舊分頁的 JS bundle 本身即為舊版，無法在不重新載入的情況下修正），但不應連帶讓使用者重新輸入一次提問內容。範圍僅限單一表單、少量欄位，不需引入通用的表單持久化框架。

**5. 正式環境資料庫定期備份：頻率與保留政策**
每 6 小時執行一次 `docker exec postgres_db pg_dump -U ubuntu project_a | gzip > backup_<timestamp>.sql.gz`，存放於 GCP 主機本機（例如 `/home/ubuntu/vps-sn/postgres/backups/`）。保留政策採分層：
- 最近 2 天：保留全部 6 小時粒度備份（8 份）
- 2–14 天：每日僅保留 1 份（該日最早一次備份）
- 超過 14 天：刪除

理由：這套系統目前是低流量、單一機構內部使用的 ERP（依先前查證約 1,300+ 會員、報名量不大），6 小時間隔足以將任何單一事故的資料損失窗口壓在半天內，不需要更高頻率（如逐小時）增加主機負擔與磁碟消耗；分層保留避免備份數量無限增長，同時保留足夠的歷史還原點供故障排查。此為使用者建議的頻率，經確認符合系統實際流量特性後採用。

**6. 排程機制：systemd timer，而非 cron**
GCP 主機（Ubuntu）目前未安裝 `cron`/`crontab` 套件（`which crontab` 查無此指令）。與其額外安裝套件，改用系統既有的 `systemd` 建立 `pg-backup.service` + `pg-backup.timer`（`OnCalendar=00/6:00:00`），減少新增套件的維護面。備份腳本本身（`backup.sh`）為獨立於本專案程式碼之外的維運腳本，存放於主機端而非 repo 內。

**7. 備份失敗處理**
腳本以 `set -euo pipefail` 撰寫，`pg_dump` 失敗時腳本立即以非零狀態結束；systemd 會將失敗記錄於 `journalctl -u pg-backup.service`，作為基本的可觀測性（不在本次範圍內加入主動通知/告警機制，見 Open Questions）。

## Risks / Trade-offs

- [Risk] 字串比對 Next.js 內部錯誤訊息，未來 Next.js 版本升級可能變更措辭導致偵測失效 → Mitigation：偵測邏輯集中於單一 utility；升級 Next.js 主版本時的檢查清單加入「重新確認此錯誤訊息格式是否仍相符」
- [Risk] 使用者可能忽略 toast、未點擊重新整理，仍可能重複遇到失敗 → Mitigation：toast 不自動消失（或給予較長 duration），文案明確說明需重新整理才能再次送出
- [Risk] `sessionStorage` 草稿在多分頁／裝置間不同步，也可能與既有邏輯衝突（例如殘留舊草稿干擾下次填寫）→ Mitigation：僅在表單有內容時才寫入，送出成功後立即清除
- [Risk] 本次修正僅涵蓋 `contact-admin`，其餘約 32 處表單仍有相同風險未修復 → Mitigation：proposal 已明確定調為分階段導入，`isDeploymentMismatchError` 與 try/catch pattern 可直接複製，後續 change 可低成本擴展至其餘表單
- [Risk] 備份僅存於 GCP 主機本機磁碟，若該主機本身故障（磁碟損壞、實例遺失），備份會與正式資料一併遺失 → Mitigation：已明列為 Non-Goal，後續可比照 VPS3 既有的 `sync-db-backup.sh` 模式，將備份同步下載到本機或其他儲存位置
- [Risk] `pg_dump` 邏輯備份在資料量成長後執行時間與檔案大小會增加，可能影響資料庫效能或超出磁碟空間 → Mitigation：目前資料量小（`project_a` DB 全表資料，數量級為千筆使用者/報名），影響可忽略；分層保留政策已控制磁碟成長，未來資料量顯著成長時應重新評估頻率與備份方式（如改用 `pg_basebackup`/WAL 歸檔）

## Migration Plan

- 無資料庫 schema 變更，純前端/Server Action 呼叫邏輯調整，無需 migration
- 部署後的人工驗證：開啟提問頁面／課程頁提問 Dialog → 部署新版（`./start.sh` 重建容器）→ 於仍停留舊版的分頁送出提問 → 確認出現「頁面已更新，請重新整理」提示且表單內容可於重新整理後還原，而非靜默失敗
- 備份機制部署後的驗證：手動觸發一次 `systemctl start pg-backup.service`，確認產生對應的 `.sql.gz` 檔案且內容可還原；確認 `pg-backup.timer` 已啟用（`systemctl list-timers`）
- Rollback：純程式碼變更，如有問題可直接回退此 change 對應的 commit，不影響既有資料；備份機制如需停用，`systemctl disable --now pg-backup.timer` 即可，不影響現有服務運作

## Open Questions

- 是否於後續 change 將 `isDeploymentMismatchError` + try/catch pattern 擴展到其餘約 32 處呼叫 Server Action 的表單？本次不處理，留待使用者決定優先順序
- 是否需要在全站層級加上 `error.tsx`/`global-error.tsx`，處理表單送出以外的情境（如頁面導航時遇到同樣錯誤）？本次範圍僅限表單送出，暫不涉及
- 是否需要異地備份（同步到 VPS3 或雲端物件儲存）與備份失敗的主動通知（如 Email/Slack 告警）？本次僅解決「完全沒有備份」，這兩項留待使用者評估後續優先順序
