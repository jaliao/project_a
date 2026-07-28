## 1. Server Action

- [x] 1.1 `app/actions/course-invite.ts` 新增 `revertGraduation(inviteId: number)`：登入檢查、查詢 invite、權限守衛（`createdById === session.user.id || canAccessAdmin`）、狀態守衛（`completedAt != null` 且 `cancelledAt == null`，否則回傳「僅已結業的課程可退回進行中」）
- [x] 1.2 單一交易內：`courseInvite.update({ completedAt: null, gradRating: null, gradTestimony: null })` ＋ `inviteEnrollment.updateMany({ where: { inviteId }, data: { graduatedAt: null, nonGraduateReason: null } })`
- [x] 1.3 交易後 `revalidatePath('/course/${inviteId}')`；不寄信、不建立通知、不寫操作 LOG；回傳成功訊息（如「已退回進行中」）

## 2. i18n 文案

- [x] 2.1 `messages/zh-TW.json` 的 `course.actions` 命名空間新增：`sectionRevert`、`revertDesc`、`revertButton`、`revertConfirmTitle`、`revertConfirmLine1`、`revertConfirmLine2`（重複寄信提醒）、`revertSuccessFallback`
- [x] 2.2 `messages/en.json` 補上對應英文翻譯
- [x] 2.3 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 3. UI 改動

- [x] 3.1 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx` 匯入 `revertGraduation`；新增 `revertOpen`／`revertLoading` state 與 `handleRevert` handler（比照 `handleReopen` 模式：呼叫 action → toast → `router.refresh()`）
- [x] 3.2 新增「結業回退作業」`Section`（`{isCompleted && (...)}`，比照「重新招募作業」的 `{isStarted && (...)}` 區塊樣式與位置），內含說明文字、「退回進行中」按鈕、確認 Dialog（含重複寄信提醒文字）

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 4.2 以講師身分，於已結業課程開啟結業回退確認視窗，確認警示文字正確顯示；確認送出後課程回到進行中、原結業學員的結業狀態消失（比對 `InviteEnrollment.graduatedAt`）
- [x] 4.3 以管理者身分重複驗證上述流程（非該課建立者）
- [x] 4.4 確認非已結業狀態（進行中）時結業回退區塊不顯示（`isCompleted` 狀態閘門正確）；一般學員（非講師/管理者）檢視課程頁看不到任何作業區塊
- [x] 4.5 確認既有「重新招募作業」（進行中退回招生中）行為未受影響（已於同一課程實測進行中→招生中成功）
