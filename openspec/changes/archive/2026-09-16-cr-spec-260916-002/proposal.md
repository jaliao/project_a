## Why

CR-SPEC-260916-001 已實作「老師新增學員」路徑的教材選擇預設值判斷（曾上過課→已有教材，新生→繁體教材），但「學員自行申請」課程（課程詳情頁「申請參加」→「選擇書籍」Dialog）的預選項目目前仍固定為「繁體教材」，未套用相同判斷邏輯，造成兩個入口的預設行為不一致。此外，「選擇書籍」Dialog 目前的選項顯示順序（無須購買／已有教材、繁體、簡體、英文）不符合預期的教材版本優先順序，需調整為「繁體、簡體、英文、已有教材」。

## What Changes

- 學員自行申請課程時，「選擇書籍」Dialog 的預選項目改依該學員是否曾上過任一課程決定：曾上過課 → 預選「已有教材」，從未上過課（新生）→ 預選「繁體教材」，與「新增學員」路徑的判斷邏輯一致。
- 抽出共用判斷邏輯 `getDefaultMaterialChoiceForUser(userId)`（`lib/data/material-items.ts`），供「新增學員」（`addStudentToInvite`）與「自行申請」（課程詳情頁）共用，避免同一條規則分散兩處各自實作、日後不同步。
- 「選擇書籍」Dialog 的教材選項顯示順序，由「無須購買／已有教材、繁體、簡體、英文」改為「繁體、簡體、英文、已有教材」；因申請（apply）與變更教材選擇（edit）共用同一元件，兩種情境皆套用新順序。

## Capabilities

### Modified Capabilities
- `course-enrollment-application`：「書籍選購 Dialog」需求——預選邏輯改依是否上過課判斷、選項顯示順序調整

## Impact

- **Data Layer**：`lib/data/material-items.ts` 新增 `getDefaultMaterialChoiceForUser(userId)`。
- **Server Actions**：`app/actions/invite-students.ts` `addStudentToInvite` 改呼叫共用函式，取代原本 inline 判斷邏輯（行為不變，純重構）。
- **頁面／元件**：`app/[locale]/(user)/course/[id]/page.tsx` 新增計算自行申請的預設教材選擇並傳給 `student-apply-section.tsx`；`components/course-session/enrollment-application-dialog.tsx` 的 `MATERIAL_OPTIONS` 陣列順序調整。
- 不涉及 i18n 新增（沿用既有 label／desc key，僅調整陣列順序與呼叫端傳入值）；不影響 Prisma schema。
