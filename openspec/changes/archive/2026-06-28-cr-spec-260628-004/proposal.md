## Why

課程建立後，講師目前無法修改課程基本資訊（名稱、預計人數、截止日、開課日、備註）—— 只能調整公開媒合設定。實務上招生期間常需調整（例如改人數、延後截止）。同時，每班人數有上限 **7 人**的規則尚未在系統落實，講師也沒有相關提醒。需在招生階段開放編輯課程資訊，並把人數規則明確化。

## What Changes

- 新增**招生階段編輯課程資訊**功能：課程詳情頁 `/course/[id]`，**僅授課老師（開課者本人，或管理者）**、且課程仍為**招生中**（`startedAt`/`cancelledAt`/`completedAt` 皆為 null）時，可編輯：
  - 課程名稱、**預計人數（maxCount）**、邀請截止日、預計開課日、內部備註。
  - **不可**修改課程書本（`courseCatalogId`）—— 避免影響已報名學員的先修驗證與已申請教材。
- **預計人數規則**：
  - `maxCount` SHALL 為整數且 **1 ≤ maxCount ≤ 7**（每班最多 7 人）。
  - 編輯時 `maxCount` **不得低於該課程已核准（approved）學員數**。
  - 介面 SHALL 顯示提醒文字（例如「每班最多 7 人」）提醒開課講師。
- **7 人上限同步套用於「新增授課」建立階段**（與編輯一致）。
- 非招生中（已開始／已取消／已結業）時不提供編輯入口；server action 亦拒絕。

## Capabilities

### New Capabilities
- `course-info-edit`: 招生階段由授課老師編輯課程資訊（名稱／人數／截止日／開課日／備註），含 maxCount 上限 7 與「不得低於已核准學員數」限制。

### Modified Capabilities
- `create-course-session`: 新增授課的預計人數 SHALL 限制為 1–7（每班最多 7 人），並於介面顯示提醒文字。

## Impact

- 驗證：`lib/schemas/course-session.ts`（`maxCount` 上限 7）、`lib/schemas/course-invite.ts`（建立邀請 `maxCount` 上限 7）；新增編輯用 schema（含 1–7 與「≥ approved」由 server 驗證）。
- Server actions：新增 `updateCourseInfo`（`app/actions/course-session.ts` 或 `course-invite.ts`）：擁有者/管理者 + 招生中守衛、欄位驗證、maxCount ≥ approved 學員數。
- UI：課程詳情頁新增「編輯課程資訊」入口與對話框（新元件，招生中且為擁有者才顯示）；建立流程 `components/course-session/create-course-wizard/step-2-basic-info.tsx` 與 `components/course-invite/create-invite-form.tsx` 加上「每班最多 7 人」提醒與上限。
- 資料層：`lib/data/course-sessions.ts`（課程詳情已含 approved 學員數，供下限驗證/顯示）。
- 文件：依 CLAUDE.md 第 9 點同步 `doc/老師手冊.md`；版本號 +1。
