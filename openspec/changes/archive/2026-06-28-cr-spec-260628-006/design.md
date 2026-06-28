## Context

`evaluateCourseStartGate({ approvedCount, orders })` 目前回傳原因：①尚無已核准學員 ②尚未申請任何教材（orders.length===0）③教材訂單尚未全部收件。cr-spec-260628-005 已在 `CourseOrder` 加上 `traditionalQty`/`simplifiedQty`，並提供 `computeMaterialProgress(total, orders)` 計算 總需求／已申請／尚未申請（`lib/utils/material-progress.ts`）。但開課門檻未使用 remaining，導致「訂單已收件後新增學員需求」時仍可開課。

## Goals / Non-Goals

**Goals:**
- 開課門檻納入「尚未申請=0」。
- 全班不需教材（總需求=0）時可開課。
- UI 與 server 端共用同一判定、server 以當下資料重算防繞過。

**Non-Goals:**
- 不改教材申請/金流流程；不改「所有訂單已收件」與「≥1 已核准學員」兩條件。

## Decisions

**決策 1：`evaluateCourseStartGate` 改以 `remaining` 判定。**
- 新簽章：`evaluateCourseStartGate({ approvedCount, remaining, orders })`，其中 `remaining: { traditional, simplified }`。
- 原因清單：
  - `approvedCount < 1` → 「尚無已核准學員」
  - `remaining.traditional + remaining.simplified > 0` → 「尚有教材未申請（繁 X、簡 Y）」
  - 任一訂單 `receivedAt == null` → 「教材訂單尚未全部收件」
- 移除舊的 `orders.length === 0 → 尚未申請任何教材`：有需求未申請時由 remaining 擋；無需求（remaining=0）且無訂單則允許開課。
- *替代方案*：保留「至少一筆訂單」並另加 remaining 檢查 → 否決，會在「全班不需教材」時誤擋，且訊息重複。

**決策 2：呼叫端提供 remaining。**
- `page.tsx` 已有 `materialProgress.remaining`，直接傳入。
- `startCourseSession` 以 `getEnrollmentMaterialSummary(inviteId)` 為總需求、該課程訂單 `traditionalQty`/`simplifiedQty` 加總為已申請，`computeMaterialProgress` 取得 remaining 後傳入門檻判定。

## Risks / Trade-offs

- [行為放寬：全班不需教材可開課] → 屬刻意調整（已與需求方確認）；有書需求未申請時仍會擋。
- [server 與 UI 判定需一致] → 兩端皆走 `computeMaterialProgress` + `evaluateCourseStartGate`，邏輯單一來源。

## Migration Plan

純程式邏輯調整，無 DB 變更。回滾＝還原 `evaluateCourseStartGate` 簽章與兩處呼叫。
