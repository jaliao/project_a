## 1. 分享 Dialog（電腦瀏覽器分支）

- [x] 1.1 `app/[locale]/(user)/course/[id]/copy-invite-link-button.tsx`：`handleShare` 的 `else`（不支援 `navigator.share`）分支改為 `setDialogOpen(true)`，移除原本直接呼叫 `navigator.clipboard.writeText` + toast 的邏輯（該邏輯移入 Dialog 內的複製連結按鈕）
- [x] 1.2 同檔新增 Dialog：唯讀 Input 顯示課程連結＋「複製連結」按鈕（沿用原本的複製到剪貼簿＋「已複製！」暫時文字邏輯；標籤重用既有 `courseLink` key，未另加重複的 `linkLabel` key）
- [x] 1.3 同檔新增「透過 LINE 分享」按鈕：`window.open('https://line.me/R/msg/text/?' + encodeURIComponent(邀請文字), '_blank')`
- [x] 1.4 同檔新增「透過 Email 分享」按鈕：`window.location.href = 'mailto:?subject=' + encodeURIComponent(主旨) + '&body=' + encodeURIComponent(邀請文字)`
- [x] 1.5 同檔新增「使用系統內建訊息邀請」區塊：Email／啟動編號 Input ＋送出按鈕，呼叫新 Server Action `inviteMemberByMessage`；成功顯示「邀請訊息已送出」toast 並提供「前往對話」連結（`/messages?with={targetUserId}`）；失敗顯示錯誤 toast 或欄位錯誤；新增 `courseTitle` prop（`page.tsx` 呼叫端一併補上）

## 2. Server Action

- [x] 2.1 `app/actions/course-invite.ts` 新增 `inviteMemberByMessage(inviteId, identifier)`：驗證登入與權限（`invite.createdById === session.user.id || canAccessAdmin`）；以 `findMemberByIdentifier`（`lib/data/invite-students.ts`）查會員，查無回傳欄位錯誤；呼叫 `findConversationsWithUser`（`lib/data/conversation.ts`）取既有一對一對話，有則 `sendConversationMessage`，否則 `startConversation`，內容為「邀請您加入「{課程名稱}」課程，請點擊連結查看詳情：{連結}」；回傳 `data.targetUserId` 供前端「前往對話」連結使用

## 3. i18n

- [x] 3.1 `messages/zh-TW.json` 的 `course.copyLink` 命名空間新增：`dialogTitle`／`dialogDesc`／`copyButton`／`lineButton`／`emailButton`／`emailSubject`／`messageInviteTitle`／`messageInviteDesc`／`identifierPlaceholder`／`sendInvite`／`inviteSuccess`／`inviteFail`／`goToConversation`／`shareText`（未另加 `linkLabel`，連結欄位標籤重用既有 `courseLink`）
- [x] 3.2 `messages/en.json` 補齊對應翻譯；執行 `npm run gen:zh-cn` 重新產生 `zh-CN.json`

## 4. 死碼清除

- [x] 4.1 刪除 `components/dashboard/dashboard-actions.tsx`
- [x] 4.2 刪除整個 `components/course-invite/` 目錄（`create-invite-dialog.tsx`／`create-invite-form.tsx`／`invite-copy-button.tsx`）
- [x] 4.3 刪除整個 `app/[locale]/(user)/invites/` 目錄（`page.tsx`）
- [x] 4.4 `app/actions/course-invite.ts` 移除 `createInvite`／`getMyInvites`／`getMyOrders`，連同僅供其使用的 import（`canTeachAny`／`canTeachBook`）一併移除
- [x] 4.5 `lib/schemas/course-invite.ts` 移除 `createInviteSchema`／`CreateInviteValues`（保留 `instructorFeedbackSchema`）
- [x] 4.6 `messages/zh-TW.json`／`en.json`／`zh-CN.json` 移除 `invites` 命名空間
- [x] 4.7 `app/robots.ts` 移除 `/invites` 規則

## 5. 驗證

- [x] 5.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 5.2 `npm run build`（Compiled successfully；`/invites` 路由已從輸出的路由列表消失，確認刪除生效；建置時的 `Can't reach database server at db` 為 host 端建置無法連容器內網 DB 的預期訊息，與本次改動無關）
- [x] 5.3 手動驗證：curl 對執行中 dev 容器煙霧測試通過（`course/439` 200 無 500；`/invites` 未登入回應 307 導向 `/login`，且 `npm run build` 路由輸出清單確認頁面已從建置產物消失）；`tsc --noEmit`／`npm run lint`／`npm run build` 涵蓋全部改動檔案並通過。**使用者已於瀏覽器實測「分享 Dialog 四種管道」「內建訊息邀請送出並於 /messages 看到」「查無會員錯誤」「手機原生分享不受影響」「已登入時 /invites 確實 404」，並確認上線後修正（Windows 桌機改用 UA 判斷裝置類型）後分享按鈕行為正確，皆無問題**
- [x] 5.4 已同步 `doc/老師手冊.md`（〈四、邀請學員〉「方式 1」改寫、〈十一〉管理者代操作清單用詞更新）、`doc/管理者操作手冊.md`（「複製邀請連結」情境與情境 E 清單改寫為「分享課程」）；`doc/學員手冊.md` 無異動角色未修改；`config/version.json` 0.1.204→0.1.205（2026-09-16）；`README-AI.md` 版本行；`ai-context/07-current-tasks.md`「已完成」清單新增本次 CR 記錄

## 6. 上線後修正（使用者實測回報）

- [x] 6.1 使用者於 Windows 桌機實測回報：點擊「分享」仍看到 Windows 系統原生分享面板，而非新增的引導 Dialog。根因：Windows 版 Edge／Chrome 桌面瀏覽器也實作 `navigator.share`，原本以其存在與否判斷手機／桌機的邏輯失效。修正 `copy-invite-link-button.tsx` 改以 User-Agent 判斷裝置類型（`/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)`），僅手機／平板且支援 `navigator.share` 時才叫用原生分享面板，其餘一律開啟分享 Dialog；同步修正 `design.md` 與 `course-session-detail` 規格對應描述
