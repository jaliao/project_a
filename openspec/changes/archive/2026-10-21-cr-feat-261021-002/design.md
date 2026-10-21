## Context

既有 `generations()`（`lib/data/monthly-report.ts`）已算出教師集合、每位教師的 mentor 判定（`mentorOf`）與世代（`gen()` 遞迴＋ memo），但只回傳彙總 `buckets`（代別 → 人數），過程中算出的逐教師明細（`teacherSet`、`mentorOf`、`memo` 內的世代）函式結束後即丟棄。

既有「會員資料 Excel 匯出」（`app/api/admin/members/export/route.ts`）已示範本次要沿用的匯出慣例：Route Handler + `auth()`/`canAccessAdmin` 驗證 + `xlsx` 套件 `json_to_sheet` + `Content-Disposition` 附檔名下載。

## Goals / Non-Goals

**Goals:**
- 管理者可下載「世代倍增發展追蹤」彙總數字背後的逐教師明細，用以核對彙總數字。
- 管理者可透過按鈕看到「代」的定義與判定邏輯說明，不需要另外詢問開發。
- 下載範圍與目前頁面所選月份一致（不需要額外的月份選擇 UI）。

**Non-Goals:**
- 不變更 `generations()` 既有彙總回傳格式與既有呼叫方（避免影響既有渲染邏輯與既有測試基準）。
- 不新增說明文字的後台編輯介面——說明文字為前端靜態文字（硬字串，比照 CLAUDE.md 第 12 點「後台字串維持繁體硬字串」）。
- 不提供「其他三個子區塊」（總體分析／第一冊各單位／第二冊各單位）的下載功能——本次僅處理世代倍增子區塊，其他子區塊若有需要另開 CR。

## Decisions

- **新增 `generationTeacherDetails(end)` 函式，與既有 `generations(end)` 並存，不合併成單一函式回傳明細＋彙總。**
  理由：`generations()` 目前由 `getMonthlyReport()` 的 `Promise.all` 平行呼叫，是頁面渲染的必經路徑；下載明細只在使用者按下按鈕時才需要查詢，拆成獨立函式可避免頁面每次渲染都多算一份明細（即使目前資料量不大，仍維持「渲染路徑」與「下載路徑」職責分離）。兩函式會重複一次查詢與 `mentorOf`/世代推導計算，可接受（下載非高頻操作，且邏輯已有既有 `generations()` 可直接複製改寫，不需要抽共用 helper 增加間接層）。

- **匯出格式採 Excel（`.xlsx`），比照 `members/export` 既有慣例。**
  理由：已與使用者確認；維持專案既有匯出功能風格一致（而非在同一後台混用 CSV 與 xlsx 兩種下載體驗）。

- **匯出端點為獨立 Route Handler（`GET /api/admin/dashboard/generations/export?month=YYYY-MM`），而非 Server Action。**
  理由：瀏覽器原生下載（`<a href>` 或 `window.location`）需要一個可直接 GET 的網址回傳檔案位元流；Server Action 不適合回傳檔案下載，沿用 `members/export` 的既有 Route Handler 模式。

- **「說明」按鈕以前端 `Dialog` 呈現靜態文字，不走資料庫或後台可編輯內容。**
  理由：說明內容是計算邏輯的固定描述，不是營運可調整的文案；比照程式碼中 `generations()` 的既有中文註解內容轉寫為白話說明，日後邏輯若調整，說明文字與註解一併修改即可同步。

- **下載範圍依目前頁面 `?month=YYYY-MM` 查詢參數，下載按鈕為帶該參數的連結，不開放另選月份。**
  理由：維持「下載＝核對畫面上看到的這份資料」的直覺行為，不需要額外 UI；要查其他月份，先切換頁面月份即可。

## Risks / Trade-offs

- [`generations()` 與新 `generationTeacherDetails()` 查詢邏輯重複，日後若其中一邊修改另一邊忘了同步改] → 兩函式皆短（約 50 行），且緊鄰定義於同一檔案同一區塊，審查時容易並排比對；暫不抽共用 helper，待日後有第三個場景需要相同邏輯再評估。
- [教師明細含真實姓名/啟動編號，下載檔案為可攜出的檔案] → 現有 `members/export` 已有相同性質的個資匯出並通過既有驗證（僅 admin/superadmin 可呼叫），本次沿用相同驗證層級，不額外加密或遮罩。

## Migration Plan

純新增功能，無資料庫變更、無既有資料相容性問題：
1. `lib/data/monthly-report.ts` 新增 `generationTeacherDetails()`，不修改既有 `generations()`。
2. 新增匯出 Route Handler。
3. `monthly-report-section.tsx` 新增兩個按鈕（下載連結＋說明 Dialog）。
4. 回退：移除新增檔案與這兩個按鈕即可，不影響既有月報任何子區塊。

## Open Questions

（無）
