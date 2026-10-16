## Why

課程詳情頁「已核准學員」區塊的「新增學員」（`AddStudentDialog`，老師/管理者手動把既有會員加進班級，非學員自行報名）目前完全沒有教材版本選擇 UI。送出新增時，`addStudentToInvite`（`app/actions/invite-students.ts:112`）呼叫 `getDefaultMaterialChoiceForUser(existingUser.id)` 自動判定 `materialChoice`：該學員若曾在任一課程有 `status=approved` 報名紀錄 → 自動設為 `none`（已有教材），否則 → 自動設為 `traditional`（繁體）。老師/管理者在新增當下**看不到**這個自動判定結果，也**無法覆寫**——若該學員這次實際需要簡體或英文版教材、或自動判定與事實不符，老師/管理者只能等學員之後自己到課程頁改（`updateMyMaterialChoice`），或完全沒注意到而在後續教材申請階段才發現版本錯誤。

對照學員自行報名流程（`course-enrollment-application` 規格的「書籍選購 Dialog」，`components/course-session/enrollment-application-dialog.tsx`），學員申請時就能自選「繁體教材、簡體教材、英文教材、已有教材」四個選項之一並填寫教材所屬姓名，且 Dialog 依該學員是否曾上過課預先選取合理預設值。這次要讓「新增學員」Dialog 補上同樣的選擇能力。

## What Changes

- `AddStudentDialog`（`components/admin/invite-student-cells.tsx`）新增教材版本選擇 UI：四選項「繁體教材、簡體教材、英文教材、已有教材」，比照既有書籍選購 Dialog 的預設邏輯——依 `getDefaultMaterialChoiceForUser` 判定結果預先選取（曾上過課 → 預選「已有教材」，新生 → 預選「繁體教材」），老師/管理者送出前可自由改選。選擇非「已有教材」時顯示教材所屬姓名輸入欄（必填，與既有書籍選購 Dialog 的驗證規則一致）。
- `addStudentToInvite`（`app/actions/invite-students.ts`）的參數新增可選的 `materialChoice`／`materialBookName`：若呼叫端帶入則直接採用，取代目前寫死呼叫 `getDefaultMaterialChoiceForUser` 覆蓋的行為；若未帶入（例如其他既有呼叫端）則維持現狀的自動判定，向後相容。
- 不需要資料庫 schema 變更：`InviteEnrollment.materialChoice`（enum）與 `materialBookName` 欄位已存在。

### 排除範圍

- 學員自行報名的書籍選購 Dialog（`course-enrollment-application` 規格）行為不變，本次不修改。
- 教材訂購/出貨相關流程（`material-book-items` 等規格）不受影響——這些流程本來就是從 `InviteEnrollment.materialChoice` 的既有值推導書本項目，只要新增學員時寫入值正確，下游流程自動吃到正確資料，不需額外改動。

## Capabilities

### New Capabilities
- `add-student-material-choice`：老師/管理者透過「新增學員」手動加入既有會員時的教材版本選擇

## Impact

- **程式碼**：`components/admin/invite-student-cells.tsx`（`AddStudentDialog`）、`app/actions/invite-students.ts`（`addStudentToInvite` 參數與內部邏輯）
- **翻譯檔**：`messages/zh-TW.json`／`en.json` 的 `course.inviteStudent` 命名空間新增教材選項相關 key（比照既有 `course.material`／enrollment dialog 用語）
- 無 Prisma schema／migration 變更
