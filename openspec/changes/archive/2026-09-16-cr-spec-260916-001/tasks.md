## 1. i18n 文案調整

- [x] 1.1 `messages/zh-TW.json`：`course.material.none`「無須購買」→「已有教材」；`course.enroll.noneDesc`「已有教材或不需要購買」→「已有個人教材不需要購買」
- [x] 1.2 `messages/en.json` 同步調整對應翻譯（`No purchase needed` → `Already have materials` 等），執行 `npm run gen:zh-cn` 重新產生 `zh-CN.json`
- [x] 1.3 新增 i18n key：`course.apply.materialLabel`（教材選擇摘要前綴）、`course.apply.changeMaterial`（「變更教材選擇」按鈕）、`course.apply.materialLocked`（「教材已確認申請，如需異動請洽老師」）、`course.enroll.editTitle`（「變更教材選擇」）、`course.enroll.confirmEdit`（「確認變更」）、`course.enroll.editSuccess`（「教材選擇已更新」），zh-TW/en 皆補齊後重新產生 zh-CN

## 2. Server Actions

- [x] 2.1 `app/actions/invite-students.ts`：`addStudentToInvite` 建立 `InviteEnrollment` 時，依該學員是否曾於任一班級有 `status=approved` 報名記錄決定 `materialChoice`（曾有／上過課 → `none`；從未有／新生 → `traditional`）
- [x] 2.2 `app/actions/course-invite.ts` 新增 `updateMyMaterialChoice(inviteId, materialChoice, bookName?)`：`auth()` 驗證登入且為該筆報名之 `userId`；限 `status='approved'` 且 `invite.materialFinalizedAt IS NULL`；`materialChoice='none'` 時 `materialBookName` 存 `null`，否則存傳入姓名（未填則沿用既有值）；成功後 `revalidatePath('/course/[id]')`

## 3. 元件

- [x] 3.1 `components/course-session/enrollment-application-dialog.tsx`：`selected` 初始值由 `''` 改為 `'traditional'`
- [x] 3.2 同檔新增 `mode?: 'apply' | 'edit'`（預設 `'apply'`）、`initialMaterialChoice`、`initialBookName` props：`mode='edit'` 時初始選取值/姓名改帶入傳入值、標題改「變更教材選擇」、確認按鈕改「確認變更」、呼叫 `updateMyMaterialChoice` 而非 `applyToCourse`、成功提示改「教材選擇已更新」
- [x] 3.3 `app/[locale]/(user)/course/[id]/student-apply-section.tsx`：已核准（approved）分支新增教材選擇摘要文字；依 `invite.materialFinalizedAt` 顯示「變更教材選擇」按鈕（開啟 `mode='edit'` 的 Dialog）或鎖定提示文字

## 4. 驗證

- [x] 4.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 4.2 `npm run build`（Compiled successfully；建置時的 `Can't reach database server at db` 為 host 端建置無法連容器內網 DB 的預期訊息，與本次改動無關）
- [x] 4.3 手動驗證：curl 對執行中 dev 容器煙霧測試通過（`course/439` 200 無 500）；`npm run build`／`tsc --noEmit` 涵蓋全部改動檔案並通過。**使用者已於瀏覽器實測「自行申請預選繁體教材」「新增學員依上過課與否決定教材摘要」「變更教材選擇」「finalize 後鎖定」等互動流程，確認無問題**
- [x] 4.4 已同步 `doc/學員手冊.md`（〈七、上課與教材〉新增「選擇教材版本」小節）、`doc/老師手冊.md`（新增學員段落補教材預設值規則）；`doc/管理者操作手冊.md` 無異動角色未修改；`config/version.json` 0.1.202→0.1.203（2026-09-16）；`README-AI.md` 版本行；`ai-context/07-current-tasks.md`「已完成」清單新增本次 CR 記錄
