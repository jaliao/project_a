## Context

課程詳情頁（`/course/[id]/page.tsx`）目前已結業課程只顯示「已結業」標籤。`getCourseSessionById` 已回傳 `completedAt` 與 `approvedEnrollments[].graduatedAt`，但缺少 `nonGraduateReason`。

## Goals / Non-Goals

**Goals:**
- 已結業課程詳情頁顯示結業資訊區塊（最後課程日期、已結業／未結業學員）
- `getCourseSessionById` 補充 `nonGraduateReason` 欄位

**Non-Goals:**
- 不新增獨立結業記錄頁面
- 不修改結業流程本身

## Decisions

### 1. 在現有詳情頁插入結業區塊
**選擇**: 直接在 `page.tsx` 的已結業判斷區塊後插入結業資訊（Server Component，無需額外 Client Component）
**理由**: 純展示邏輯，不需要互動，Server Component 已足夠。

### 2. 資料來源直接沿用 getCourseSessionById
**選擇**: 只補充 `nonGraduateReason` 到現有 select，不新增查詢函式
**理由**: 課程詳情頁已呼叫此函式，避免重複 DB 查詢。

## Risks / Trade-offs

- `nonGraduateReason` 為 nullable 字串，顯示時需處理 null（顯示「—」）→ 低風險
