## Why

課程「選擇書籍」流程存在文案與功能落差：(1) 「無須購買」選項的文案容易讓已自備教材的學員誤以為系統認定其「不需要教材」，說明文字亦未點出「個人已有」的語意；(2) 老師使用「新增學員」（`addStudentToInvite`）直接將既有會員加入班級時，該筆報名一步到位建立為 `status=approved`，`materialChoice` 因此落到 Prisma 預設值 `none`；(3) 課程詳情頁「申請參加」按鈕與其背後的「選擇書籍」Dialog（`EnrollmentApplicationDialog`）僅在學員尚未有報名記錄（`!myEnrollment`）時才會渲染，已核准（approved）的學員一律只顯示「✓ 已加入此課程」純文字——這使得老師代加入的學員完全沒有機會選擇或事後變更教材，也因 `materialChoice=none` 不會被計入教材需求清單（`lib/data/material-items.ts`），對應到使用者回報「老師幫學生加入帳號之後，[學生]不能使用申請購書的按鈕」。

## What Changes

- 文案調整：`course.material.none`「無須購買」→「已有教材」；其說明文字 `course.enroll.noneDesc`「已有教材或不需要購買」→「已有個人教材不需要購買」（`messages/zh-TW.json`／`en.json`，`zh-CN.json` 以 `npm run gen:zh-cn` 重新產生）。
- 老師/管理者透過「新增學員」直接加入既有會員時，`materialChoice` 依該學員是否曾在任一班級被核准過（是否上過課）決定：從未上過課（新生）明確設為 `traditional`（繁體教材），曾上過課則設為 `none`（已有教材）——取代目前一律落到 schema 預設值 `none` 的行為；學員自行申請時的「選擇書籍」Dialog，初始選取項目亦由「未選擇」改為預先勾選「繁體教材」（學員送出前仍可自由改選其他選項）。
- 已核准（approved）的學員在課程詳情頁新增可檢視目前教材選擇、並重新開啟「選擇書籍」Dialog 進行變更的入口；該班教材申請一旦由講師「確認完成」（`CourseInvite.materialFinalizedAt` 有值）後即鎖定，不可再變更。

## Capabilities

### Modified Capabilities
- `course-enrollment-application`：「選擇書籍」Dialog 初始選取值改為繁體教材；已核准狀態下新增可檢視/變更教材選擇之需求
- `admin-enrollment-management`：「新增學員」建立報名時 `materialChoice` 改依該學員是否上過課決定（新生 `traditional`／曾上過課 `none`），不再一律落到 `none`

## Impact

- **Server Actions**：`app/actions/invite-students.ts`（`addStudentToInvite` 建立報名時依該學員是否曾上過課，帶入 `materialChoice: 'traditional'` 或 `'none'`）；`app/actions/course-invite.ts` 新增 `updateMyMaterialChoice`（學員本人於已核准且未 finalize 時變更教材選擇/教材所屬姓名）。
- **元件**：`components/course-session/enrollment-application-dialog.tsx`（支援「申請」與「變更」兩種模式、初始選取值調整）、`app/[locale]/(user)/course/[id]/student-apply-section.tsx`（已核准狀態顯示教材選擇摘要與變更入口，依 `materialFinalizedAt` 決定是否可變更）。
- **i18n**：`messages/zh-TW.json`／`en.json` 調整既有 `course.material.none`／`course.enroll.noneDesc`，新增 `course.apply.materialLabel`／`changeMaterial`／`materialLocked` 與 `course.enroll.editTitle`／`confirmEdit`／`editSuccess` 等 key（`zh-CN.json` 重新產生）。
- 不影響 Prisma schema 欄位定義與既有 migration；不改變 `InviteEnrollment.materialChoice` 之 DB 層 `@default(none)`（僅調整應用層明確帶入的值），對既有資料無相容性影響。
