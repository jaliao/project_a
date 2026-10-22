## 1. Schema

- [x] 1.1 `prisma/schema/user.prisma`：`User` 新增 `isProxyMember Boolean @default(false)`。
- [x] 1.2 `make schema-update name=add_proxy_member_flag` 建立 migration 並套用本機 dev DB。

## 2. 建立代填學員（Server Action）

- [x] 2.1 `app/actions/invite-students.ts` 新增 `addProxyStudentToInvite()`：驗證 `canManageInvite`、人數上限（非管理者）、先修驗證（`checkPrerequisites`，建立後的新帳號一律視為新生查核）；交易內依序：以既有 `spiritId`／`loginHandle` 核發邏輯建立 `User`（`isProxyMember: true`、`roles: ['user']`、`email: null`、`passwordHash: null`、`realName`/`gender`/`churchType`/`churchId`/`churchOther` 取自表單）→ 建立 `InviteEnrollment`（`status: 'approved'`，教材選擇依新生預設規則）→ 寫入 `AdminActionLog`（`action: 'enrollment_add'`，`detail` 註明「建立代填學員（未註冊）」）。
- [x] 2.2 表單驗證（Zod）：`realName` 必填（trim 後非空）；`gender` 選填（預設 `unspecified`）；`churchType`/`churchId`/`churchOther` 選填（預設 `none`）。
- [x] 2.3 任一驗證或限制失敗（先修未通過、已達人數上限、`realName` 空白）時，不建立 `User`，不留下半成品帳號。

## 3. 新增學員 Dialog（UI）

- [x] 3.1 `components/admin/invite-student-cells.tsx`（`AddStudentDialog`）新增分頁／切換：「選擇既有會員」（既有 `StudentPicker` 路徑）／「建立代填學員」（新表單：真實姓名、性別、所屬教會）。
- [x] 3.2 「建立代填學員」表單沿用既有「已結業」勾選＋結業日、教材選擇子流程（與既有路徑共用 UI）。
- [x] 3.3 送出後錯誤訊息（先修未通過、人數上限、必填姓名）以 toast／欄位錯誤呈現，風格與既有路徑一致。

## 4. 未註冊徽章顯示

- [x] 4.1 `components/shared/student-picker.tsx`：候選卡片（好友清單＋搜尋結果）於 `isProxyMember === true` 時顯示「未註冊」徽章。
- [x] 4.2 `lib/data/student-picker.ts`（`searchStudentCandidates`）查詢與回傳型別補上 `isProxyMember` 欄位。
- [x] 4.3 `/admin/members` 列表每列、`/admin/members/[id]` 詳情頁頁首：`isProxyMember === true` 時姓名旁顯示「未註冊」徽章。
- [x] 4.4 `/admin/members/duplicates` 候選配對卡片：`isProxyMember === true` 一側顯示「未註冊」徽章。

## 5. 帳號合併（主/副帳號預設方向）

- [x] 5.1 `app/actions/member-merge.ts` 的 `suggestSecondary()`：判斷條件由「恰好一方 `isUndeliverableEmail`」擴充為「恰好一方 `isUndeliverableEmail` 或 `isProxyMember` 為 `true`」；兩訊號同時命中不同帳號、或皆未命中時維持回傳 `null`（不給預設值）。
- [x] 5.2 `previewMemberMerge()`／`mergeMembers()` 的帳號查詢 `select` 補上 `isProxyMember`（供上述判斷與通知選項邏輯使用）。
- [x] 5.3 合併預覽 UI：副帳號 `isProxyMember === true` 時不顯示「通知副帳號使用者」勾選框（比照既有 `isUndeliverableEmail` 邏輯合併判斷，兩者任一為真即隱藏）。

## 6. 疑似重複帳號清單（最高信心等級）

- [x] 6.1 重複帳號偵測查詢：「最高信心」判定條件加入「至少一方 `isProxyMember` 為 `true`」。
- [x] 6.2 候選配對並排顯示卡片新增「是否為代填學員」欄位（「未註冊」徽章），沿用 4.4 的徽章元件。

## 7. 會員總數統計排除代填學員

- [x] 7.1 **作廢**：首頁（`dashboard-home` 對應頁面/查詢）的「會員總數」查詢加上 `isProxyMember: false` 篩選。實作時確認 `/dashboard` 現已改為純轉址（導向 `/user/[spiritId]` 或 `/profile`），無統計卡片內容，此任務對應的查詢不存在；已與使用者確認作廢，不實作，亦不修改 `dashboard-home` 規格（已從本次 change 的 `specs/` 移除，主規格 `openspec/specs/dashboard-home/spec.md` 本身的過時內容不在本次 CR 範圍內修正）。
- [x] 7.2 `/admin/dashboard` 「學員分析」的「學員總數」查詢加上 `isProxyMember: false` 篩選；確認「各教會會員總數」「近期活躍學員數」「會員性別」「各年齡會員人數」等其餘統計維持不過濾（業務口徑不變）。

## 8. 驗證

- [x] 8.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 8.2 情境：建立代填學員後，確認其 `email`／`passwordHash` 為 `null`、無 `Account` 記錄；嘗試以任意密碼或 Google 帳號登入皆失敗。（使用者於 dev 環境實測後確認無誤，未逐項記錄操作過程）
- [x] 8.3 情境：對有先修要求的班級（如「啟動豐盛」）建立代填學員，確認被拒絕、不建立任何帳號。（使用者於 dev 環境實測後確認無誤，未逐項記錄操作過程）
- [x] 8.4 情境：完成一次「代填學員 → 自行註冊真實帳號 → 合併」全流程，確認合併精靈預設代填帳號為副帳號、報名／結業紀錄正確搬移到真實帳號、代填帳號標記 `mergedIntoId` 後列表不再顯示「未註冊」徽號（因已被標記合併，依既有合併後顯示規則處理）。（使用者於 dev 環境實測「王小名」案例，確認無誤後接受；過程中釐清本次 CR 的「建立代填學員」表單不含 Email，連結真帳號走手動合併路徑，自動 Email 連結為 CR-FEAT-261022-003 範圍）
- [x] 8.5 情境：確認首頁與後台儀錶板「會員總數」／「學員總數」卡片數值不含代填學員，但「疑似重複帳號清單」「StudentPicker」仍能搜尋到代填學員。（使用者於 dev 環境實測後確認無誤，未逐項記錄操作過程；首頁部分對應 7.1，已作廢）
- [x] 8.6 情境：確認課程人數、結業人數、教會分布等既有業務統計維持計入代填學員（數值未因本次變更而減少）。（使用者於 dev 環境實測後確認無誤，未逐項記錄操作過程）

## 9. 操作手冊與版本號

- [x] 9.1 檢查並更新 `doc/管理者操作手冊.md`：新增學員流程補充「建立代填學員」操作說明。
- [x] 9.2 檢查並更新 `doc/老師手冊.md`：同步補充「建立代填學員」操作說明。
- [x] 9.3 檢查 `doc/學員手冊.md`：確認代填學員本身無法登入使用系統，本次無需修改；若有需要說明的情境再補充。
- [x] 9.4 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期。
