## Why

老師（華晨希）透過班級頁「新增學員」直接把學員（黃俐寧）加入「啟動豐盛」班級，但該學員並未完成先修課程「啟動靈人」（`CourseCatalog` 已設定啟動豐盛的先修為啟動靈人）。學員自行報名（`applyToCourse`）與教師開課（`createInvite`）皆已呼叫 `checkPrerequisites()` 驗證先修，唯獨老師／管理者直接新增學員的 `addStudentToInvite`（`app/actions/invite-students.ts`）漏未檢查，導致未完成先修的學員能被直接掛進有先修限制的班級，形成先修規則的漏洞。

## What Changes

- **修改** `addStudentToInvite`：新增前驗證**目標學員**是否已結業該班級課程（`courseCatalogId`）的所有先修課程；未完成時拒絕新增，回傳欄位錯誤說明缺少哪門先修課程。此檢查**不分操作者角色**（管理者與該課講師一律擋下，不例外放行），與「學員自行報名」的先修驗證規則一致。
- **不修改**「學員選擇元件」（`searchStudentsForInvite` / `StudentPicker`）的搜尋結果——未完成先修的學員仍會出現在搜尋結果與好友清單中（能被看到、能被選取），僅在確認送出新增時才擋下並顯示錯誤訊息。
- **不影響**既有「已在該班級」排除、人數上限、補登結業等既有驗證邏輯，先修檢查為新增的一道獨立驗證。

## Capabilities

### New Capabilities

### Modified Capabilities
- `admin-enrollment-management`：新增學員時，新增「目標學員先修驗證」規則，未完成先修課程時拒絕新增並回傳欄位錯誤

## Impact

- **Server Actions**：`app/actions/invite-students.ts` 的 `addStudentToInvite`——查詢 `CourseInvite` 時補 `courseCatalogId`，並呼叫既有 `checkPrerequisites(userId, courseCatalogId)`（`lib/data/course-catalog.ts`，`joinInvite`/`applyToCourse` 已在用）
- **重構**：新增 `formatMissingPrerequisites()` helper 取代 `applyToCourse` 與 `addStudentToInvite` 兩處重複的 `missingPrereqs.map((p) => p.label).join('、')` 格式化邏輯，避免同一段字串拼接程式碼出現第二份
- **UI**：新增學員的 Dialog 元件於送出失敗時顯示欄位錯誤（沿用既有「該學員已在此班級」等 `errors.userId` 呈現方式），不需新增畫面
- 無 schema 變更（`CourseCatalog.prerequisites` 資料已存在，啟動豐盛 → 啟動靈人 之先修關聯已於 `prisma/seed.ts` 設定）
