## Why

開課門檻（`evaluateCourseStartGate`）目前只檢查「≥1 已核准學員 + 至少一筆教材訂單 + 所有訂單已收件」，**沒有檢查「尚未申請」的教材需求**。因此若所有既有訂單都已收件後，又核准了一位選書（繁/簡）的學員，總需求增加但門檻仍判定可開課，「開始上課」按鈕仍可按——這是 BUG（實際發生於 `course/346`：後加一位簡體學員仍可開課）。

## What Changes

- 開課門檻新增條件：**「尚未申請」必須為 0**（總需求 − 已申請，繁/簡各自），亦即所有已核准學員的書籍需求都已被教材訂單涵蓋。
- 以「尚未申請=0」取代舊的「至少一筆訂單」硬性條件：
  - 有書籍需求卻尚未申請（或申請不足）→ `remaining > 0` → 擋下並提示。
  - **全班皆不需教材（總需求=0、無訂單）→ 允許開課**（沒有任何書要等，屬合理放寬）。
- 仍保留：≥1 已核准學員；所有教材訂單皆已收件。
- `startCourseSession`（server 端）以當下資料重算 remaining 後驗證，與 UI 共用判定，防繞過。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-status`: 「課程詳情頁『開始上課』按鈕」啟用條件新增「尚未申請教材需求為 0」，並以此取代「至少一筆教材訂單」；全班不需教材時允許開課。

## Impact

- `lib/utils/course-start-gate.ts`：`evaluateCourseStartGate` 改以 `remaining`（尚未申請繁/簡）判定，移除「orders.length===0」硬擋。
- `app/(user)/course/[id]/page.tsx`：傳入已計算的 `materialProgress.remaining`。
- `app/actions/course-invite.ts`：`startCourseSession` 以 `getEnrollmentMaterialSummary` + 訂單繁/簡加總重算 remaining 後驗證。
- 規格：`openspec/specs/course-status/spec.md`（MODIFIED）。
- 文件：`doc/老師手冊.md` 開課門檻說明；版本號 +1。
