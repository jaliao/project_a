## 1. 共用邏輯抽取

- [x] 1.1 `lib/data/material-items.ts` 新增 `getDefaultMaterialChoiceForUser(userId): Promise<'none' | 'traditional'>`：查詢該 `userId` 是否曾有 `status='approved'` 報名記錄，曾有 → `'none'`，否則 → `'traditional'`
- [x] 1.2 `app/actions/invite-students.ts` `addStudentToInvite` 改呼叫 `getDefaultMaterialChoiceForUser`，移除原本 inline 的 count 查詢與三元判斷（行為不變，純重構）

## 2. 自行申請預設值

- [x] 2.1 `app/[locale]/(user)/course/[id]/page.tsx`：`currentUserId && !isInstructor && !myEnrollment` 時呼叫 `getDefaultMaterialChoiceForUser(currentUserId)` 取得 `applicantDefaultMaterialChoice`，傳給 `StudentApplySection`
- [x] 2.2 `student-apply-section.tsx` 新增 `defaultMaterialChoice` prop，傳入 apply 模式 `EnrollmentApplicationDialog` 的既有 `initialMaterialChoice` prop

## 3. 選項順序

- [x] 3.1 `components/course-session/enrollment-application-dialog.tsx`：`MATERIAL_OPTIONS` 陣列順序改為 `traditional`／`simplified`／`english`／`none`

## 4. 驗證

- [x] 4.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 4.2 `npm run build`（Compiled successfully）
- [x] 4.3 手動驗證：curl 對執行中 dev 容器煙霧測試通過（`course/439` 200 無 500）；`tsc --noEmit`／`npm run build` 涵蓋全部改動檔案並通過。**使用者已於瀏覽器實測「新生預選繁體教材」「曾上過課學員預選已有教材」「選項依序為繁/簡/英/已有教材」等互動流程，確認無問題**
- [x] 4.4 已同步 `doc/學員手冊.md`（〈七、上課與教材〉「選擇教材版本」小節文字更新）；`doc/老師手冊.md`／`doc/管理者操作手冊.md` 無異動角色未修改；`config/version.json` 0.1.203→0.1.204（2026-09-16）；`README-AI.md` 版本行；`ai-context/07-current-tasks.md`「已完成」清單新增本次 CR 記錄
