## Context

`SupportInquiry`（`app/actions/support-inquiry.ts`、`lib/data/support-inquiry.ts`）目前提問人資訊完全透過 `user` 關聯即時 join 取得（`submitterSelect`：`spiritId`／`realName`／`englishName`／`nickname`／`displayNameMode`／`gender`／`churchType`／`churchOther`／`church.name`），並在 `lib/data/support-inquiry.ts` 以 `getMemberDisplayName()`、`genderLabel()`、`churchLabel()` 三個 helper 即時算出後台卡片顯示用的 `submitterName`／`submitterGenderLabel`／`submitterChurchLabel`。`userId` 為 `onDelete: Cascade`，帳號被刪除（`deleteMember()`）時整筆提問（含已回覆內容）隨之消失——這正是 2026-07-27 事故的成因，也是本次修改的主要對象。

`AdminActionLog`（`prisma/schema/admin-log.prisma`）已有一套「操作紀錄＋文字快照＋關聯 onDelete SetNull」的既有模式（用於 `enrollment_add`／`enrollment_remove`），但 `inviteTitle` 為必填，且其 spec（`admin-operation-log`）明文排除涵蓋班級學員增減以外的操作；`deleteMember()`（`app/actions/admin.ts:287`）目前完全未寫入任何稽核紀錄。

## Goals / Non-Goals

**Goals:**
- 學員提問（`SupportInquiry`）建立當下即把後台卡片顯示所需的提問人資訊「快照」進資料列本身，之後即使提問人帳號被刪除，後台仍能完整顯示這些文字，並在 UI 加註「此帳號已被刪除」。
- `deleteMember()` 刪除會員時，於同一交易內寫入一筆 `AdminActionLog`（`action: member_delete`），可追溯操作者與被刪帳號。
- `AdminActionLog` 支援無課程情境的操作（`inviteTitle` 改可選）。

**Non-Goals:**
- 不處理 `repliedBy`（回覆管理者）被刪除後的顯示問題——該欄位既有關聯已是可選且預設 `SetNull`，行為不變，非本次事故範圍。
- 不引入「軟刪除會員」或改變 `deleteMember()` 現有 hard delete 語意，僅補稽核紀錄。
- 不回溯補寫 2026-07-24／2026-07-27 事故中已經被刪除帳號所對應、已經消失的既有提問資料（無法復原，僅預防未來再發生）。

## Decisions

### 1. 提問人資訊採「建立當下快照」而非「刪除當下補寫」
在 `submitInquiry()` 建立 `SupportInquiry` 時，直接把當下算好的顯示字串寫入資料列（新增欄位）：
- `submitterName`：`getMemberDisplayName()` 算出的顯示名稱
- `submitterSpiritId`：`user.spiritId`
- `submitterRealName`：`user.realName`
- `submitterGenderLabel`：`genderLabel()` 算出的文字（男／女／未設定）
- `submitterChurchLabel`：`churchLabel()` 算出的文字（單位名稱／自填單位／—）

**理由**：比照 `AdminActionLog` 既有模式（建立當下寫快照，而非等到刪除時才補救）。刪除當下才快照的做法必須在 `deleteMember()` 裡逐一回填「其名下所有 SupportInquiry」，邏輯分散且容易漏；建立當下快照則每筆提問自帶完整顯示資訊，`deleteMember()` 完全不需感知 `SupportInquiry` 的存在。
**替代方案考慮**：曾考慮在 `deleteMember()` 內於刪除前才寫入快照——但這樣仍需修改 `deleteMember()` 去查詢並回填所有關聯的 `SupportInquiry`，且若日後其他刪除路徑（如帳號自我刪除功能，若未來新增）忘記做同樣處理，快照仍會遺漏；建立當下寫入可一勞永逸。

### 2. `userId` 改為可選＋`onDelete: SetNull`，UI 以「關聯是否存在」判斷帳號是否已刪除
不新增額外的 boolean 欄位（如 `isSubmitterDeleted`）；後台資料層（`getInquiryList`）判斷 `user` 關聯是否為 `null` 即可知道帳號是否已被刪除，並在該情況下：
- 顯示名稱／身分資訊一律改用快照欄位（`submitterName` 等）
- 額外顯示文字提示「此帳號已被刪除」（後台卡片／詳情皆需呈現，緊鄰提問人資訊）

**理由**：`userId` 是否為 `null` 本身就是「帳號是否已被刪除」的真實狀態，不需要額外欄位維護同步。

### 3. `AdminActionLog.inviteTitle` 改為可選
`deleteMember()` 屬於無課程情境的操作，若 `inviteTitle` 維持必填，寫入時只能塞空字串或無意義預設值。改為 `String?`，`member_delete` 動作寫入時該欄位留空；既有 `enrollment_add`／`enrollment_remove` 寫入邏輯不變（該兩動作仍會填入實際課程標題）。

### 4. `deleteMember()` 稽核紀錄內容
寫入 `actorId`（操作管理者）、`targetUserId`（留 null，因為即將被刪除，符合既有 `onDelete: SetNull` 設計）、`actorName`（操作者顯示名稱）、`targetName`（被刪除帳號顯示名稱＋email，比照 `admin-operation-log` 現行慣例）、`action: 'member_delete'`、`detail`（如「刪除會員（spiritId／email）」摘要）。寫入時機為刪除前（同一交易內，避免刪除成功但紀錄寫入失敗的不一致）。

## Risks / Trade-offs

- **[風險] 新增快照欄位僅對「本次修改後新建立」的提問生效，既有 18 筆歷史提問若其提問人帳號未來被刪除，仍會因快照欄位為空而顯示不完整。** → 緩解：`submitInquiry()` 上線後所有新提問皆會快照；既有提問若提問人尚未被刪除可視需要之後另開小任務回填（非本次範圍，於 tasks 中不涵蓋）。
- **[風險] Schema 變更涉及正式環境既有資料（`support_inquiries` 18 筆、`admin_action_logs` 既有筆數）。** → 緩解：兩處新增欄位皆為可選（`String?`）或有明確預設值，`userId` 從必填改可選、`inviteTinviteTitle` 從必填改可選皆為向下相容變更（不需要為既有列回填資料），`make schema-update` 產生的 migration 不會破壞既有資料。
- **[風險] `deleteMember()` 稽核寫入若失敗，可能連帶讓整個刪除交易失敗，阻擋原本可正常執行的刪除操作。** → 緩解：稽核寫入與刪除同在一個 `$transaction` 內，語意上「稽核紀錄寫入失敗」本身就該視為刪除失敗並整體回滾，避免又發生「刪了但沒有稽核」的情況——此為刻意選擇，不是需規避的風險。

## Migration Plan

1. 修改 `prisma/schema/support-inquiry.prisma`：`userId` 改 `String? @db.Uuid`、關聯改 `onDelete: SetNull`；新增 `submitterName String`、`submitterSpiritId String?`、`submitterRealName String?`、`submitterGenderLabel String`、`submitterChurchLabel String`（新增欄位需給預設值或允許 null 以相容既有 18 筆資料——採可選處理，既有列該欄位為 `null`）。
2. 修改 `prisma/schema/admin-log.prisma`：`inviteTitle` 改 `String?`。
3. `make schema-update name=support-inquiry-retain-on-delete`，確認正式環境 migration 相容（既有資料無需回填即可套用）。
4. 修改 `app/actions/support-inquiry.ts`（`submitInquiry`）：建立時一併計算並寫入快照欄位。
5. 修改 `lib/data/support-inquiry.ts`（`getInquiryList`）：`user` 為 `null` 時改用快照欄位，並回傳一個 `isSubmitterDeleted: boolean` 供 UI 顯示提示文字。
6. 修改 `app/actions/admin.ts`（`deleteMember`）：刪除前於同交易內寫入 `AdminActionLog`。
7. 後台提問卡片／詳情元件（`components/admin/support-inquiry-card.tsx` 等）：`isSubmitterDeleted` 為真時於提問人資訊旁顯示「此帳號已被刪除」。
8. 部署後以正式環境既有情境驗證：刪除一個有提問紀錄的測試帳號，確認提問卡片仍顯示提問人快照資訊＋刪除提示，且 `admin_action_logs` 出現對應 `member_delete` 紀錄。

## Open Questions

- 既有 18 筆歷史提問是否需要立即為快照欄位補值（避免其提問人日後被刪除時顯示空白）？本次先不處理，待需要時再開獨立小任務執行一次性資料回填。
