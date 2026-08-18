## 1. 重現與根因確認

- [x] 1.1 於測試環境還原正式環境資料庫備份（2026-08-18 已完成：從 GCP 正式站 `/backup/data/postgres/` 抓回最新 `pg_dumpall`，萃取 `project_a` 資料庫段落還原至本機 `project_a-db-1` 容器）
- [x] 1.2 以老師（楊金津 PA261453）／學員（林碧茹 PA261588）之實際課程與報名資料，重現「確認移除」出現錯誤畫面的情況（以還原後的真實資料查詢 `invite_enrollments.id = 1640` 直接確認，未透過瀏覽器點擊重現，但已定位到確切觸發的程式路徑）
- [x] 1.3 確認錯誤畫面來源：**並非**未受 try/catch 保護的查詢例外，而是既有 `_count.shipmentItems > 0` 守衛正常擋下（該報名確實有一筆教材寄送紀錄 `material_shipment_items.id = 94`），回傳的是受控 toast 而非未受控例外。根因與 design.md 原始推測不符，已與使用者確認後更新 proposal.md／design.md／specs delta，並調整以下任務範圍（移除該守衛，不再擋下）

## 2. Server Action 修正

- [x] 2.1 `app/actions/invite-students.ts` 的 `removeStudentFromInvite`：**移除** `_count.shipmentItems > 0` 時直接拒絕的判斷（保留 `_count.shipmentItems` 查詢結果供後續組通知內容使用）
- [x] 2.2 擴大 try/catch 範圍涵蓋 `inviteEnrollment.findUnique` 與 `user.findUnique` 兩段查詢，任何例外一律回傳 `{ success: false, message: '移除失敗，請稍後再試' }`，`console.error` 附上 `enrollmentId` 與錯誤內容
- [x] 2.3 函式簽章新增 `reason: string` 參數；伺服器端驗證 `reason.trim().length > 0`，未通過回傳 `{ success: false, errors: { reason: ['請填寫移除原因'] } }`
- [x] 2.4 交易內 `AdminActionLog.detail` 附加移除原因（保留既有結業狀態摘要，後接「；原因：{reason}」）
- [x] 2.5 交易成功後，於交易外以 try/catch 包覆（fire-and-forget，不 await 阻塞主流程回傳）：`prisma.user.findMany({ where: { roles: { hasSome: ['admin', 'superadmin'] } }, select: { id: true } })`，逐一呼叫 `createNotification`，title 為「學員移除通知」，body 含班級名稱、被移除學員姓名、操作者姓名、移除原因；若移除當下 `_count.shipmentItems > 0`，body 額外附加教材寄送提醒文字

## 3. UI — 確認移除 Dialog

- [x] 3.1 `components/admin/invite-student-cells.tsx` 的 `RemoveStudentButton`：新增 `reason` 的 `useState`，Dialog 內新增必填 Textarea（比照 `archive-course-dialog.tsx` 原因欄位樣式）
- [x] 3.2 移除原本「⚠️ 此報名有教材寄送紀錄，系統將拒絕移除」的擋下文案，改為一般提醒文字（有教材寄送紀錄時仍提示、但不阻止送出）
- [x] 3.3 「確認移除」按鈕於 `reason.trim()` 為空時停用（教材寄送紀錄不再是停用條件）；`handleRemove` 呼叫 `removeStudentFromInvite(enrollmentId, reason)`
- [x] 3.4 若 `res.errors?.reason` 存在，於原因欄位下方顯示對應錯誤訊息

## 4. 驗證

- [x] 4.1 已驗證：無法取得瀏覽器自動化工具，且 Next.js Server Action 的 RPC 協定（`Next-Action` header + router-state-tree）無法單靠 curl 可靠重現，故改以「直接對還原後的真實資料執行與 Server Action 完全相同的 Prisma 交易」驗證——對真實報名 `invite_enrollments.id = 1640`（老師 PA261453／學員 PA261588）執行刪除＋`AdminActionLog` 寫入，並用實際的 `admin`/`superadmin` 查詢邏輯（4 位管理者）呼叫既有 `createNotification` 寫入通知，皆成功；另以真實管理者測試帳號（`101@iwillshare.org.tw`，seed-test-accounts 記載之預設密碼）登入並 GET `/course/413`（HTTP 200，頁面正確渲染「林碧茹」與「移除」按鈕，無錯誤畫面）
- [x] 4.2 已驗證：`invite_enrollments.id = 1640` 刪除成功；對應 `material_shipment_items.id = 94` 於刪除後 `enrollmentId` 變為 `null`、其餘欄位（`bookName`／`studentName`／`shipmentId`）完整保留，證實 FK `ON DELETE SET NULL` 行為與教材寄送紀錄確實不再擋下移除
- [x] 4.3 驗證無權限者仍無法移除：`canManageInvite` 邏輯本次未修改；以真實非管理者、非該課建立者帳號（`gordon@test.com`，roles `{user,teacher_1}`）代入 `#413` 課程驗證 `canAccessAdmin(roles) || invite.createdById === userId` 仍正確評估為 `false`
- [x] 4.4 `npm run lint`（0 errors，16 個既有警告與本次變更無關）
- [x] 4.5 型別檢查：`npx tsc --noEmit` 0 errors。`npm run build` 於 `/_global-error` 頁面 prerender 階段失敗（`Cannot read properties of null (reading 'useContext')`）——已用 `git stash` 驗證此問題在未套用本次變更的乾淨 main 分支上同樣存在，屬既有問題、與本次變更無關，不在本次範圍內修復

## 5. 文件與版本號同步

- [x] 5.1 更新 `doc/管理者操作手冊.md`：移除學員流程新增必填原因說明；移除「有教材寄送紀錄會被擋下」的舊說明，改為仍可移除＋通知管理者
- [x] 5.2 更新 `doc/老師手冊.md`：講師移除學員流程新增必填原因說明，並說明教材寄送紀錄不再擋下移除
- [x] 5.3 檢查 `doc/學員手冊.md`：grep 確認無「移除學員」／「教材寄送」相關內容，不需同步
- [x] 5.4 手冊檔首版本標註與日期更新（v0.1.170 → v0.1.171，2026-08-18）；`config/version.json` patch 版號同步 +1，`updatedAt` 更新為 2026-08-18

## 6. 正式環境（人工執行，非本 change 程式範圍）

- [x] 6.1 提醒使用者：本 change 僅實作並驗證於測試環境；正式環境的實際移除操作待此變更部署上線後，由使用者本人於正式環境親自執行，不由 AI／開發者代為在正式環境執行移除（已於本次 apply 完成回報中提醒）
