## Context

`CourseInvite` 課程資訊（title / maxCount / expiredAt / courseDate / notes / courseCatalogId）目前僅在建立時設定；既有可修改的只有 `updateMatchSettings`（公開媒合）與 `setCourseStatusAdmin`（後台狀態）。建立路徑有兩條：`create-course-wizard`（`courseSessionSchema`）與 `create-invite-form`（`createInviteSchema` → `createInvite` action）。兩處 maxCount 目前皆僅驗證 ≥1，無上限。課程詳情資料層 `getCourseSessionById` 已回傳 `approvedEnrollments`，可得已核准學員數。

## Goals / Non-Goals

**Goals:**
- 招生階段（招生中＋擁有者/管理者）可編輯 名稱／人數／截止日／開課日／備註。
- maxCount 規則：1–7，且編輯時 ≥ 已核准學員數；UI 顯示 7 人提醒。
- 7 人上限同步套用建立階段。

**Non-Goals:**
- 不可改 `courseCatalogId`（書本）。
- 不改報名／核准／教材／開課流程。
- 不處理「已開始/結業」後的編輯（明確不開放）。

## Decisions

**決策 1：新增 `updateCourseInfo` server action（沿用 `updateMatchSettings` 守衛樣式）。**
- 簽章：`updateCourseInfo(inviteId, input: { title; maxCount; expiredAt; courseDate; notes? })`。
- 守衛：登入 → 取 `createdById` + 狀態旗標 + `_count.approved 學員` → 擁有者或 `canAccessAdmin` → 課程須招生中（`startedAt`/`cancelledAt`/`completedAt` 皆 null，否則拒絕「課程非招生中，無法編輯」）。
- 驗證：title 非空；maxCount 整數且 1–7；`maxCount >= approvedCount`（否則「人數不可低於已核准學員數（N）」）；expiredAt 不早於今天（沿用建立規則）。
- `revalidatePath('/course/${inviteId}')`。

**決策 2：編輯用 Zod schema 與建立共用人數規則。**
- 新增 `editCourseInfoSchema`（title/maxCount/expiredAt/courseDate/notes）；maxCount 上限 7 寫進 schema；「≥ approved」屬執行期資料相依，於 server action 驗證（schema 無法得知 approved 數）。
- 同步把 `courseSessionSchema` 與 `createInviteSchema` 的 maxCount 加上 `≤ 7`。

**決策 3：UI —— 課程詳情頁新增「編輯課程資訊」對話框。**
- 新元件 `components/course-session/edit-course-info-dialog.tsx`（client，RHF + zodResolver）。
- 入口按鈕僅在 `isInstructor（或 admin）&& 招生中` 顯示（與現有 `CourseDetailActions`/`MatchSettingsEditor` 顯示條件一致）。
- 人數欄位旁顯示提醒文字「每班最多 7 人」；建立流程兩處（wizard step-2、create-invite-form）亦加同提醒。

**決策 4：下限以「已核准（approved）」為準。**
- 與需求一致；pending 不計。server 以當下 DB 的 approved 數驗證，避免前端過期值。

## Risks / Trade-offs

- [兩條建立路徑都要改上限] → 全數列入 tasks；`npm run build` 驗收。
- [並發：編輯時學員數變動] → server 以當下 approved 數驗證為準。
- [既有資料 maxCount > 7] → 歷史資料不強制回填；下次編輯時才受 7 限制（可接受）。

## Migration Plan

無 DB 變更（純驗證與 UI）。回滾＝移除 action/schema/UI 變更。
