## Context

課程先修規則（`CourseCatalog.prerequisites`）已有兩個既有的驗證進入點：
- `applyToCourse`（`app/actions/course-invite.ts`）：學員自行報名時，驗證**自己**是否已結業所有先修課程
- `createInvite`（`app/actions/course-invite.ts`）：教師開課時，驗證**教師自己**是否已結業所有先修課程（admin/superadmin 豁免）

兩者皆呼叫共用 helper `checkPrerequisites(userId, targetCatalogId)`（`lib/data/course-catalog.ts`），回傳缺少的先修課程清單。

但 `addStudentToInvite`（`app/actions/invite-students.ts`）——老師／管理者在班級頁透過 `StudentPicker` 直接把**既有會員**掛進班級——完全沒有呼叫這個 helper。這條路徑繞過了先修規則：任何人只要被老師手動加入，就能無視先修限制直接進到後續課程的班級，此次事件（黃俐寧被加入啟動豐盛，但未完成啟動靈人）即為此漏洞的實際案例。

## Goals / Non-Goals

**Goals:**
- `addStudentToInvite` 新增前，驗證**被加入的學員**（而非操作者）是否已結業目標班級課程的所有先修課程
- 驗證邏輯與既有 `checkPrerequisites()` 一致、直接重用，不另建平行邏輯
- 未通過驗證時，以現有 `errors.userId` 欄位錯誤機制呈現（UI 已支援渲染，不需改元件）

**Non-Goals:**
- 不修改 `searchStudentsForInvite` / `StudentPicker` 的搜尋或好友清單邏輯——未完成先修的學員仍應被搜尋到、被看見、被選取，只在確認送出時才擋下（符合本次需求「要可以看到學員」）
- 不新增「管理者可覆蓋先修限制」的例外機制——如有歷史資料需要補登（如學員實際已完成但系統無記錄），走既有 `learning-record-backfill-admin` 後台審核流程處理，不從此處開後門
- 不改變 `checkPrerequisites()` 本身的邏輯或簽章

## Decisions

**檢查對象是 `userId`（被加入者），不是 `session.user.id`（操作者）**
理由：這條路徑的本質是「老師代學員報名」，規則應等同學員自行報名時的資格要求（`applyToCourse` 檢查的也是報名者本人），而不是比照「教師開課」檢查操作者資格。

**不比照 `createInvite` 給 admin/superadmin 豁免**
理由：`createInvite` 豁免 admin 是因為那個檢查是「教師本人夠不夠格開課」，admin 開課不代表 admin 本人修過課；而這裡檢查的是**被加入的學員**是否具備先修資格，與操作者角色無關——admin 手動加人一樣不能讓學員跳過先修規則。若未來真的需要例外補登，應走 `learning-record-backfill-admin` 的正式審核與紀錄流程，不在這個一般新增入口開放。

**檢查時機放在「重複報名」檢查之後、教材預設值計算之前**
理由：若學員已在班級中，回傳「該學員已在此班級」比「缺先修」更貼近實際狀況、避免誤導；教材預設值計算需要確定會真的建立報名才有意義，放在所有驗證通過之後執行可省一次不必要的查詢。

**沿用 `errors: { userId: [...] }` 而非新增 `message`**
理由：現有 UI（`invite-student-cells.tsx`）已將 `errors.userId?.[0]` 渲染於學員選擇欄位下方（如「該學員已在此班級」），沿用同一機制無需改動元件，維持與既有「已在此班級」錯誤一致的呈現位置與樣式。

**新增共用 `formatMissingPrerequisites()` helper，重構既有重複的格式化邏輯**
`applyToCourse`（`app/actions/course-invite.ts`）已有 `missingPrereqs.map((p) => p.label).join('、')` 這段格式化邏輯；本次新增的 `addStudentToInvite` 檢查需要同樣的格式化，若直接複製會造成第二處重複。改為在 `lib/data/course-catalog.ts`（`checkPrerequisites` 旁）新增 `formatMissingPrerequisites(missing: { id: number; label: string }[]): string`，回傳以「、」串接的課程名稱字串；`applyToCourse` 與 `addStudentToInvite` 皆改呼叫此 helper，兩處訊息前後綴文字（「才能加入此課程」／「才能加入此班級」）各自保留，僅共用中段的名稱格式化。

## Risks / Trade-offs

- [老師選定學員後才發現對方缺先修，需重新選人] → 可接受：與「已在此班級」錯誤的既有 UX 一致，不阻塞流程，僅需重新操作
- [`checkPrerequisites` 內部會多一次 DB 查詢（`InviteEnrollment` 依 userId 查已結業課程）] → 影響可忽略：新增學員為低頻操作，且 `createInvite`／`applyToCourse` 已用相同查詢模式

## Migration Plan

1. 於 `lib/data/course-catalog.ts` 新增 `formatMissingPrerequisites()` helper
2. 修改 `app/actions/course-invite.ts`：`applyToCourse` 既有的 `missingPrereqs.map((p) => p.label).join('、')` 改呼叫 `formatMissingPrerequisites(missingPrereqs)`（行為不變，純重構）
3. 修改 `app/actions/invite-students.ts`：`addStudentToInvite` 查詢 `CourseInvite` 時補選 `courseCatalogId`，於重複報名檢查後呼叫 `checkPrerequisites(existingUser.id, invite.courseCatalogId)`，缺少先修時以 `formatMissingPrerequisites()` 組訊息並回傳 `errors: { userId: [...] }`
4. 無 schema／seed 變更（先修關聯資料已存在）
5. 手動驗證：以非管理者教師帳號，對已設定先修的班級（如啟動豐盛）嘗試新增未完成啟動靈人的既有學員，確認被擋下且錯誤訊息正確；再驗證已完成先修的學員仍可正常加入
