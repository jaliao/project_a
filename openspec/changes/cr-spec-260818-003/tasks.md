## 1. 重現與根因確認

- [ ] 1.1 於測試環境還原正式環境資料庫備份（依 `make tunnel-vps3` 相關流程取得備份、還原至本機測試/開發環境）
- [ ] 1.2 以老師（楊金津 PA261453）／學員（林碧茹 PA261588）之實際課程與報名資料，重現「確認移除」出現錯誤畫面的情況
- [ ] 1.3 確認錯誤畫面來源是否為 `removeStudentFromInvite`（`app/actions/invite-students.ts:213`／`231`）中未受 try/catch 保護的查詢拋出例外；若根因與 design.md 推測不符，回頭調整本 change 的後續 tasks

## 2. Server Action 修正

- [ ] 2.1 `app/actions/invite-students.ts` 的 `removeStudentFromInvite`：擴大 try/catch 範圍涵蓋 `inviteEnrollment.findUnique` 與 `user.findUnique` 兩段查詢，任何例外一律回傳 `{ success: false, message: '移除失敗，請稍後再試' }`，`console.error` 附上 `enrollmentId` 與錯誤內容
- [ ] 2.2 函式簽章新增 `reason: string` 參數；伺服器端驗證 `reason.trim().length > 0`，未通過回傳 `{ success: false, errors: { reason: ['請填寫移除原因'] } }`
- [ ] 2.3 交易內 `AdminActionLog.detail` 附加移除原因（保留既有結業狀態摘要，後接「；原因：{reason}」）
- [ ] 2.4 交易成功後，於交易外以 try/catch 包覆（fire-and-forget，不 await 阻塞主流程回傳）：`prisma.user.findMany({ where: { roles: { hasSome: ['admin', 'superadmin'] } }, select: { id: true } })`，逐一呼叫 `createNotification`，title 為「學員移除通知」，body 含班級名稱、被移除學員姓名、操作者姓名、移除原因

## 3. UI — 確認移除 Dialog

- [ ] 3.1 `components/admin/invite-student-cells.tsx` 的 `RemoveStudentButton`：新增 `reason` 的 `useState`，Dialog 內新增必填 Textarea（比照 `archive-course-dialog.tsx` 原因欄位樣式）
- [ ] 3.2 「確認移除」按鈕於 `reason.trim()` 為空時停用；`handleRemove` 呼叫 `removeStudentFromInvite(enrollmentId, reason)`
- [ ] 3.3 若 `res.errors?.reason` 存在，於原因欄位下方顯示對應錯誤訊息（`<FieldError>`，依 CLAUDE.md 第 12 點 i18n 規範以 key 呈現，或沿用既有非 i18n 元件之作法——依 `invite-student-cells.tsx` 現況決定是否已 i18n 化，維持與檔案既有慣例一致）

## 4. 驗證

- [ ] 4.1 於測試環境（已還原正式環境備份）以修正後程式重新執行 1.2 的重現步驟，確認「確認移除」不再出現錯誤畫面、原因欄位為必填、移除成功後管理者收到站內通知
- [ ] 4.2 驗證教材寄送關聯擋下、無權限擋下等既有分支未受影響
- [ ] 4.3 `npm run lint`
- [ ] 4.4 `npm run build`

## 5. 文件與版本號同步

- [ ] 5.1 更新 `doc/管理者操作手冊.md`：移除學員流程新增必填原因說明
- [ ] 5.2 更新 `doc/老師手冊.md`：講師移除學員流程新增必填原因說明
- [ ] 5.3 檢查 `doc/學員手冊.md` 是否需同步（預期不需要，移除為講師/管理者操作、學員端無對應介面變更）
- [ ] 5.4 手冊檔首版本標註與日期更新；`config/version.json` patch 版號 +1（0.1.170 → 0.1.171），`updatedAt` 更新為當日日期

## 6. 正式環境（人工執行，非本 change 程式範圍）

- [ ] 6.1 提醒使用者：本 change 僅實作並驗證於測試環境；正式環境的實際移除操作待此變更部署上線後，由使用者本人於正式環境親自執行，不由 AI／開發者代為在正式環境執行移除
