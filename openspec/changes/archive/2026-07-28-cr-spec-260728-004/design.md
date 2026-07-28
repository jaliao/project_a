## Context

`class_max_capacity`（`AdminSetting`，預設 `7`）目前只在**開課／編輯課程**時透過 `resolveMaxCapacity(isAdmin)`（`app/actions/course-session.ts:30-32`，未匯出）套用：老師被限制在設定值，管理者放寬到硬頂 `CLASS_MAX_CAPACITY_HARD_CAP`（999）。「新增學員」（`addStudentToInvite`，`app/actions/invite-students.ts`）是另一條完全獨立的路徑，未讀取、未比對任何人數上限，形成規則不一致的漏洞。

`canManageInvite`（可操作新增學員的權限判斷）允許「管理者」或「該課建立者（老師）」，兩者目前在 `addStudentToInvite` 內被同等對待；但人數上限規則需要進一步區分「是否為管理者」（`canAccessAdmin`），因為該課建立者本身仍是老師身分，須受上限限制。

## Goals / Non-Goals

**Goals:**
- 新增學員時，若操作者非管理者且加入後之已核准人數將超過 `class_max_capacity`，SHALL 拒絕並提示。
- 管理者新增學員不受此上限限制（沿用既有 `CLASS_MAX_CAPACITY_HARD_CAP` 硬頂語意）。
- 上限判斷邏輯與開課／編輯課程共用同一份設定與同一段解析邏輯，避免規則分裂。
- UI 於已核准人數達上限、操作者非管理者時提前停用送出並提示，減少送出後才被拒絕的落差。

**Non-Goals:**
- 不變更 `class_max_capacity` 設定本身的儲存方式或後台編輯行為。
- 不變更開課／編輯課程既有的上限邏輯或 `CourseInvite.maxCount` 欄位語意。
- 不針對「補登結業」以外的其他新增學員情境另訂規則（規則對所有新增學員一律適用）。

## Decisions

- **共用上限解析邏輯**：將 `resolveMaxCapacity(isAdmin)` 自 `app/actions/course-session.ts` 移至 `lib/data/admin-settings.ts` 並匯出，`course-session.ts` 與 `invite-students.ts` 皆改為 import 共用版本。理由：避免同一段「讀設定＋依身分解析上限」邏輯在兩處各自實作、未來設定語意變更時需改兩處。
- **比對基準**：新增後之**已核准（approved）人數**（`prisma.inviteEnrollment.count({ where: { inviteId, status: 'approved' } })`），而非 `CourseInvite.maxCount`。理由：`maxCount` 是課程建立時的「預計招生人數」，可能由管理者設定超過 `class_max_capacity`；本次要限制的是「老師這個操作動作」本身的人數上限，與課程當初登記的預計人數是兩件事，維持與開課/編輯課程一致的判斷來源（設定值本身），語意單純、不需額外讀取 `maxCount`。
- **檢查時機**：在 `addStudentToInvite` 內，於 `canManageInvite`／`cancelledAt` 檢查之後、`findMemberByIdentifier` 查會員之前執行人數上限檢查（不需等到確認查得到會員才檢查，減少不必要查詢）。
- **角色判斷**：上限檢查使用 `canAccessAdmin(session.user.roles)`（與 `resolveMaxCapacity` 既有參數語意一致），而非 `canManageInvite` 的結果——確保「該課建立者但非管理者」的老師仍受限制。
- **錯誤回傳方式**：以 `{ success: false, message: '已達班級人數上限（N 人），如需超過請洽管理者' }` 回傳（非 `errors.identifier`），因為此錯誤與輸入的 Email/啟動編號無關，走既有的 toast 顯示路徑（`AddStudentDialog` 已有 `if (res.message) toast.error(res.message)`）。
- **UI 資料傳遞**：`page.tsx` 取得 `capacity`（沿用 `resolveMaxCapacity(isAdmin)` 的 `capacity`）與既有的 `isAdmin`，經 `ApprovedStudentsSection` 傳入 `AddStudentDialog`；已核准人數沿用該區塊既有的 `students.length`，不另外查詢。`AddStudentDialog` 於非管理者且 `approvedCount >= capacity` 時停用送出按鈕並顯示提示文字，維持與 server 端一致的判斷式（`>=` 表示「再加入一位就會超過」）。

## Risks / Trade-offs

- [風險] UI 端與 server 端各自計算一次「是否達上限」，若未來兩處判斷式不同步（例如比對符號不一致）可能出現 UI 允許但 server 拒絕的落差 → Mitigation：UI 與 server 皆採 `approvedCount >= capacity`（非 admin 時）同一判斷式，server 端為最終防線，UI 僅為體驗優化。
- [風險] 移動 `resolveMaxCapacity` 到共用模組可能影響 `course-session.ts` 既有呼叫點的匯入路徑 → Mitigation：僅搬移函式本體並於原檔案改為 import，呼叫方式與回傳值不變，行為零異動。
