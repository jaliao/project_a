## Context

- 「每班最多 7 人」硬寫於共用 zod `lib/schemas/course-session.ts`：`courseSessionSchema`（refine `>=1 && <=7`）與編輯 schema（`.max(7)`），供開課精靈（`create-course-wizard/step-2-basic-info`）與 `edit-course-info-dialog` 共用（client＋server 皆驗）。
- Server actions：`createCourseSession`、`updateCourseInfo`（`app/actions/course-session.ts`）。`updateCourseInfo` guard 已為「擁有者 or `canAccessAdmin`」，並擋「`maxCount < 已核准學員數`」。
- 課程詳情 `course/[id]/page.tsx` 目前僅在 `isInstructor` 顯示「編輯課程資訊」對話框。
- 全域設定：`AdminSetting` ＋ `getAdminSetting(key, default)` / `setAdminSetting`；系統設定頁「基本設定」分頁（remittance 等）。

## Goals / Non-Goals

**Goals:**
- 後台系統設定新增「班級人數上限」（`class_max_capacity`，預設 7），套用開課與編輯（含老師端）。
- 管理者可對個別班級將 `maxCount` 設為超過上限，並可於課程詳情編輯該班人數。

**Non-Goals:**
- 不改「不得低於已核准學員數」規則；不改其他開課/編輯欄位。
- 不做 DB migration（`AdminSetting` 已存在）；不做 i18n（後台設定繁體；既有前台表單維持現狀）。

## Decisions

1. **驗證分工（權威在 server）**：共用 zod 的上限由固定 `7` 放寬為**寬鬆硬頂**（如 `<= 999`，純防呆）。**實際上限於 server action 驗證**：
   - 讀 `capacity = Number(getAdminSetting('class_max_capacity', '7'))`。
   - `isAdmin = canAccessAdmin(session.user.roles)`。
   - 非管理者：`maxCount <= capacity`，否則回錯（訊息含上限值）。
   - 管理者：不受 `capacity` 限制（仍需 `>=1` 且 `>= 已核准學員數`）。
2. **全域設定**：新增 `AdminSetting` key `class_max_capacity`（字串數字，預設 `'7'`）。系統設定「基本設定」新增表單（client）＋ server action `updateClassMaxCapacity`（superadmin 或 admin？沿現有設定權限；remittance 為 superadmin，depth 為 superadmin）——依現有「基本設定」權限一致（superadmin）。驗證為正整數（合理上界如 1–99）。
3. **前台表單上限提示**：`createCourseSession` 流程與 `edit-course-info-dialog` 的 input `max` 與提示文字改讀傳入的 `capacity`（由 server component 讀設定後傳入）。管理者情境傳入放寬值（如不設 `max` 或高上界）＋提示標註「管理者可超過」。
4. **管理者編輯入口**：`course/[id]/page.tsx` 的 `EditCourseInfoDialog` 顯示條件由 `isInstructor` 擴為 `isInstructor || canAccessAdmin(...)`；並將 `capacity` 與 `isAdmin` 傳入對話框以決定 input 上限與提示。
5. **maxHint 文案**：沿用 i18n key `course.editInfo.maxHint`／wizard 提示，改為以 `capacity` 帶入（如「每班最多 {capacity} 人」）；管理者顯示可超過之提示（後台繁體，不強制 i18n）。
6. 相容：既有課程 `maxCount` 不變；設定預設 7 時行為與現況一致。

## Risks / Trade-offs

- **client 放寬 → 依賴 server 權威**：若前端漏擋，server 仍會擋；管理者放寬僅 server 依身分判定，避免前端偽造。
- **capacity 設定注入表單**：需由 server component 讀設定傳入 client 表單（開課精靈入口、課程詳情）；多入口皆需帶入。
- 管理者「無上限」仍設合理硬頂（防呆 999）避免異常值。
- 設定權限：與既有「基本設定」一致（superadmin）；若要 admin 也能改需再確認（本批沿 superadmin）。
- 無 migration，風險低；上限調整即時生效（下次讀取）。
