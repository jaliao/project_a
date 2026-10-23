## Why

CR-FEAT-261022-003（代填學員邀請與自動連結）上線後實測發現體驗不足：
- 「邀請 Email／補發邀請」操作僅限管理者（`canAccessAdmin`），且入口塞在後台會員詳情頁「特殊設定」分頁內，混在暫停會員、帳號修改等一大堆操作之間。實務上第一線負責代填學員的是**該學員所屬班級的授課老師**，老師卻無法自行修正 email 或補發邀請，每次都要請管理者代勞。
- 管理者看不到該帳號的邀請歷史，只能看到目前 `User.email` 這一個值，無法確認「補發邀請」是否真的生效、舊連結是否已失效。

## What Changes

- 「編輯邀請 Email」與「補發邀請」操作的入口自後台會員詳情頁**移至該學員的會員首頁**（`/user/{spiritId}`），新增一個頂層區塊「未註冊學員邀請管理」。此區塊 SHALL 僅在**被檢視者 `isProxyMember === true`**、且**檢視者為管理者或該學員所屬班級的授課老師**時顯示；其他檢視者（包含一般學員）開啟同一頁面時，完全不會看到此區塊。一旦該學員完成註冊（`isProxyMember` 轉為 `false`），此區塊即自然從首頁消失，不需額外開關。
- 操作授權範圍放寬：原僅 `canAccessAdmin` 可呼叫 `updateProxyInviteEmail`／`resendProxyInvite`，現改為**管理者或該代填學員所屬班級的授課老師**（即該學員名下存在至少一筆 `InviteEnrollment`，其 `CourseInvite.createdById` 為操作者）皆可呼叫。
- 後台會員詳情頁新增獨立分頁「未註冊會員專區」，置於所有分頁最前面；此分頁**僅顯示唯讀的「邀請紀錄」列表**（不含編輯表單，編輯功能已移至會員首頁），對所有會員皆顯示（無論目前是否為代填學員、是否已完成註冊），供管理者隨時查閱歷史。
- `ProxyInviteToken` 新增 `voidedAt` 欄位，用以區分「補發邀請時被作廢」與「受邀者實際完成註冊」兩種結束狀態（目前皆共用 `usedAt`，無法在紀錄列表上分辨）；補發邀請的作廢動作改寫 `voidedAt`，完成註冊的使用動作維持寫 `usedAt`。
- 邀請連結失效文案（`/complete-registration` 頁面預檢文案與 `completeProxyRegistration` 的錯誤訊息）統一加上「請聯繫啟動事工同工或是授課老師」，取代原僅提及「老師」的文案。

## Capabilities

### Modified Capabilities
- `admin-member-management`：移除「代填學員邀請 Email 管理」區塊（原於特殊設定分頁），改為新增「未註冊會員專區」唯讀分頁，顯示邀請紀錄。
- `proxy-invite`：編輯邀請 Email／補發邀請的授權範圍自「僅管理者」放寬為「管理者或該學員所屬班級的授課老師」；`ProxyInviteToken` 新增 `voidedAt` 欄位與對應語意、有效性判定邏輯更新、失效文案更新。
- `student-profile-page`：會員首頁新增「未註冊學員邀請管理」頂層區塊（僅符合資格的檢視者可見）。

## Impact

- **Schema**：`prisma/schema/user.prisma` 的 `ProxyInviteToken` 新增 `voidedAt DateTime?`；migration（純新增可選欄位，不影響既有資料）。
- **資料存取層**：`lib/data/proxy-invite.ts` 的 `invalidatePendingTokens` 改寫 `voidedAt`（不再寫 `usedAt`）；`getValidInviteToken`/`getActiveInviteForToken` 的有效性查詢需同時排除 `voidedAt` 非 null 的紀錄；新增 `getProxyInviteHistory(userId)`（供後台歷史列表）與 `isClassTeacherOfMember(teacherId, memberId)`（判定授權範圍）。
- **Server Actions**：`app/actions/admin.ts` 的 `updateProxyInviteEmail`／`resendProxyInvite` 權限檢查放寬為 `canAccessAdmin(roles) || isClassTeacherOfMember(session.user.id, userId)`。
- **前端**：
  - 新增 `components/dashboard/proxy-invite-panel.tsx`（取代 `components/admin/member-proxy-invite-form.tsx`，置於會員首頁，文案 i18n 化）。
  - `app/[locale]/(user)/user/[spiritId]/page.tsx` 新增「未註冊學員邀請管理」頂層區塊（基本資料之後、課程之前）。
  - `app/[locale]/(admin)/admin/members/[id]/page.tsx` 的 `Tabs` 新增 `proxy` 分頁（置於最前，僅顯示唯讀歷史列表）；移除「特殊設定」分頁內原本的邀請 Email 編輯區塊；刪除不再使用的 `components/admin/member-proxy-invite-form.tsx`。
  - 新增 `components/admin/member-proxy-invite-history.tsx` 呈現後台歷史列表。
- **i18n**：`messages/zh-TW.json`／`messages/en.json` 新增 `studentProfile.proxyInvite.*` 命名空間（區塊標題、欄位標籤、按鈕文字）；`account.completeRegistration.invalidDesc` 更新文案。
- **文案**：`app/actions/auth.ts` 的 `completeProxyRegistration` 內兩處 hardcoded 錯誤訊息更新。
- 依賴 CR-FEAT-261022-003（`ProxyInviteToken`／完成註冊頁機制需先存在）。
