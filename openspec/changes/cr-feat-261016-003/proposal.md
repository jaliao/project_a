## Why

CR-FEAT-261016-002 已上線的「疑似重複帳號」清單盤點出 68 組候選配對（實測：最高信心 51／高信心 14／中信心 3），但目前管理者發現重複帳號後，沒有任何工具可以實際把兩筆帳號收斂成一筆——只能分別手動處理兩個帳號（例如手動搬移報名記錄、重新核發結業證書），既繁瑣又容易出錯或遺漏。

本 CR 新增「合併帳號」精靈：管理者指定主/副帳號後，系統在單一交易內把副帳號名下的關聯資料（報名、結業、好友、留言、對話、提問、學習紀錄等）改指向主帳號，副帳號保留為「已合併」的殘影記錄（不刪除，供日後追溯），且副帳號自此無法再登入。

## What Changes

- **合併入口**：會員詳情頁「特殊設定」分頁新增「合併帳號」按鈕（選擇另一帳號，不受 `ENABLE_MEMBER_DELETE` 限制）；CR-002「疑似重複帳號」清單的每組候選新增「合併這兩筆帳號」連結，直接帶入雙方開啟精靈（該清單頁本身仍維持純查看，此連結只是導覽/預開對話框，不在清單頁直接執行任何寫入）。
- **主/副帳號判定**：兩帳號其中一方 email 為合成 seed 信箱（`isUndeliverableEmail`）時，系統預設該筆為副帳號、另一筆為主帳號；兩邊都不是合成信箱時，不給預設值，管理者必須手動指定。管理者可隨時對調預設值。
- **合併預覽**：確認主/副帳號後，顯示預覽畫面：
  - 副帳號名下各類關聯資料筆數（報名、結業、好友、留言、對話、提問、學習紀錄、通知、推播訂閱）。
  - Unique 衝突清單（結業證書同課程目錄、上課意願刊登、同班級報名）：若雙方都有衝突的資料，列出雙方內容，由管理者逐筆選擇保留主帳號或副帳號的那筆，未選擇前無法送出。
  - `roles`（多重身分）與 `learningLevel`（學習等級）的合併結果：預設 roles 取聯集、learningLevel 取較高值，管理者可手動調整後再送出。
  - 個人資料補空值預覽：主帳號的 `phone`／`churchType`+`churchId`+`churchOther`／`englishName`／`gender`／`birthYear`／`teacherNo` 若為空（`gender` 以 `unspecified` 視為空），且副帳號對應欄位有值，顯示「將補上」提示；主帳號已有值的欄位不受影響，不自動帶入或覆蓋。
- **確認合併**：單一交易內完成：
  - 副帳號的關聯資料（報名、結業、好友、留言、對話、提問、學習紀錄、通知、推播訂閱）改指向主帳號；好友/報名/證書/上課意願等 unique 衝突依管理者選擇的一側保留、另一側捨棄。
  - 主帳號之 `phone`／`churchType`+`churchId`+`churchOther`／`englishName`／`gender`／`birthYear`／`teacherNo`：原為空且副帳號有值的欄位，補上副帳號的值；主帳號已有值的欄位維持不變。
  - `User` 新增 `mergedIntoId`／`mergedAt`／`mergedById` 欄位：副帳號標記為已合併，**不刪除**該列。`Account`（OAuth 綁定）不搬動，留在副帳號上（反正登入已被阻擋）。
  - 寫入一筆 `AdminActionLog`（`action = member_merge`）。
- **登入阻擋**：副帳號 `mergedIntoId` 非 null 時，無論 Google 或密碼登入皆被拒絕（新登入於 `signIn` callback 擋下；已存在的 session 於下一次請求在 `(user)/layout.tsx` 即時擋下並清除），導向新的獨立頁面「此帳號已併入其他帳號」（比照 `/account-suspended` 的做法）。
- **合併通知**：副帳號 email 若為合成信箱，合併畫面不顯示通知選項（寄送必定被 mailer 層略過）；否則顯示「通知副帳號使用者改用新帳號登入」勾選框，預設不勾，由操作管理者決定，通知信寄至 `resolveContactEmail()` 解析地址。
- **權限**：等同現有 `canAccessAdmin`（`admin` 即可，比照 `deleteMember`／`transferCourseInvites`）。

## Capabilities

### Modified Capabilities

- `admin-member-management`：新增「合併帳號」與「合併帳號登入阻擋」兩項需求。
- `admin-duplicate-account-detection`：候選配對新增可導向合併精靈的連結（原「不提供任何合併操作入口」需求修正為允許導覽連結，頁面本身仍不直接執行寫入）。

## Impact

- **資料庫**：`prisma/schema/user.prisma` 新增 `mergedIntoId`／`mergedAt`／`mergedById` 欄位與對應自關聯；跑一次 `make schema-update`。
- **Server Actions**：新檔 `app/actions/member-merge.ts`（`searchMembersForMerge`／`previewMemberMerge`／`mergeMembers`）。
- **元件**：新檔 `components/admin/member-merge-dialog.tsx`（重用 `StudentPicker` 元件殼挑選另一帳號，比照 `member-course-invite-transfer.tsx` 的做法）；會員詳情頁與疑似重複帳號清單頁掛載此對話框。
- **登入流程**：`lib/auth.ts`（`signIn` callback）、`app/[locale]/(user)/layout.tsx`（既有 session 即時擋下）新增 `mergedIntoId` 檢查；新檔 `app/api/merged-logout/route.ts`、`app/[locale]/(guest)/account-merged/page.tsx`（比照 `/api/suspended-logout`、`/account-suspended`）；`lib/auth/route-access.ts` 註冊新路由。
- **寄信**：`lib/mailer.ts` 新增合併通知信函式。
- **操作紀錄**：`config/admin-log-action.ts` 新增 `member_merge` 動作代碼。
- **i18n**：`messages/zh-TW.json`／`messages/en.json` 新增 `pageMeta.accountMerged`，跑 `npm run gen:zh-cn` 同步簡體。
- **操作手冊**：`doc/管理者操作手冊.md` 新增合併帳號操作說明。
