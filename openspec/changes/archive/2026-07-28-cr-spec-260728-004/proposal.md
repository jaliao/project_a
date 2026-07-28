## Why

「新增學員」（`addStudentToInvite`）目前完全沒有人數上限檢查，任何有權限操作的講師都能無限制加人，與開課／編輯課程時已套用的「班級人數上限」（`class_max_capacity`，後台可調、預設 7；管理者可放寬）規則不一致，造成班級實際人數可無限超過講師原訂的招生規模。

## What Changes

- `addStudentToInvite` 新增人數上限檢查：加入後之**已核准（approved）人數**若超過上限，且操作者**非管理者**（僅為該課講師），SHALL 拒絕新增並回傳明確錯誤訊息。
- 上限來源沿用既有後台設定 `class_max_capacity`（`AdminSetting`，預設 7，後台可調整），與開課／編輯課程時的老師上限規則一致；管理者不受此上限限制（沿用 `resolveMaxCapacity` 既有的管理者硬頂 999 語意）。
- 「新增學員」對話框（`AddStudentDialog`）於已核准人數達上限、且操作者非管理者時，SHALL 停用送出並提示已達上限。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `admin-enrollment-management`：「新增學員」需求新增人數上限檢查（老師受 `class_max_capacity` 限制、管理者可超過）

## Impact

- `app/actions/invite-students.ts`（`addStudentToInvite`）：新增已核准人數查詢與上限比對邏輯，非管理者超過上限時拒絕。
- `components/admin/invite-student-cells.tsx`（`AddStudentDialog`）：需接收目前已核准人數與上限，於非管理者且達上限時停用送出並顯示提示。
- `app/[locale]/(user)/course/[id]/approved-students-section.tsx`：需將已核准人數與上限傳入 `AddStudentDialog`。
- 可能重用 `app/actions/course-session.ts` 既有的 `resolveMaxCapacity(isAdmin)` 邏輯或 `lib/data/admin-settings.ts` 的 `class_max_capacity` 讀取方式，避免重複實作。
- 無 migration（沿用既有 `AdminSetting` 設定）。
