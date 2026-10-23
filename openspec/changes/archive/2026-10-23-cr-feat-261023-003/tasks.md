## 1. 前端

- [x] 1.1 新增 `components/conversation/profile-friend-actions.tsx`（client）：props `targetUserId`、`initialIsFriend`、`addFriendLabel`、`messageLabel`；未是好友時顯示「加好友」按鈕（呼叫 `addFriendByUserId`，成功後翻轉狀態並 toast），已是好友時渲染既有 `SendMessageButton`
- [x] 1.2 `app/[locale]/(user)/user/[spiritId]/page.tsx`：移除姓名列的 `SendMessageButton`（第 212 行）
- [x] 1.3 `page.tsx`：`!isOwnPage` 時查詢 `isFriend(session.user.id, user.id)`（`lib/data/friendship.ts`）作為 `initialIsFriend`
- [x] 1.4 `page.tsx`：在「學習進度」`CourseProgressCards` 區塊下方、`!isOwnPage` 時插入 `ProfileFriendActions`

## 2. i18n

- [x] 2.1 `messages/zh-TW.json` 的 `studentProfile` 命名空間新增：`addFriend`（加好友）、`addFriendSuccess`（已加入好友）、`addFriendFailed`（加好友失敗，請稍後再試）
- [x] 2.2 `messages/en.json` 補對應英文翻譯
- [x] 2.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`（不手改簡體檔）

## 3. 驗證

- [ ] 3.1 手動驗證：以非本人身分開啟尚非好友的學員首頁，學習進度下方顯示「加好友」按鈕，姓名列不再有傳訊息按鈕
- [ ] 3.2 手動驗證：點擊「加好友」成功後，按鈕即時切換為「傳訊息」，點擊可導向 `/messages?with=`
- [ ] 3.3 手動驗證：以已是好友身分開啟該學員首頁，直接顯示「傳訊息」按鈕
- [ ] 3.4 手動驗證：開啟自己的首頁，不顯示此操作按鈕群組
- [x] 3.5 `npm run lint` 與 `npm run build` 通過

## 4. 文件同步

- [x] 4.1 依 CLAUDE.md 第 9 點，檢查並更新 `doc/學員手冊.md`（傳訊息入口位置變更、新增加好友入口說明）
- [x] 4.2 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期
- [x] 4.3 依 CLAUDE.md 第 8 點更新 `ai-context/` 有異動的章節檔
