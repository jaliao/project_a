## Why

學員首頁（`/user/{spiritId}`）基本資料區塊的姓名列上，目前對「他人」視角直接掛了一顆「傳訊息」按鈕（`SendMessageButton`，標籤 `conversation.cardMessage`）。使用者反饋這顆按鈕不該放在姓名旁邊，且瀏覽他人首頁時除了傳訊息，還需要能直接「加好友」——目前只能到「媒合布告欄／找學員」頁籤才能加好友，入口不直覺。

## What Changes

- 移除姓名列上的「傳訊息」按鈕。
- 在「學習進度」三卡區塊下方（他人視角才顯示），新增一組操作按鈕：
  - 尚未是好友：顯示「加好友」按鈕（重用既有 `addFriendByUserId` action）。
  - 已是好友：顯示「傳訊息」按鈕（重用既有 `SendMessageButton`）。
  - 加好友成功後，按鈕即時切換為「傳訊息」（比照 `components/match-board/student-matching-list.tsx` 的既有互動模式，不整頁刷新）。
- 本人頁面（`isOwnPage`）不顯示這組按鈕，沿用現有判斷。

## Capabilities

### Modified Capabilities
- `student-profile-page`：新增「他人視角 — 加好友／傳訊息操作」Requirement；移除基本資料姓名列原有的傳訊息按鈕行為。

## Impact

- **前端**：
  - `app/[locale]/(user)/user/[spiritId]/page.tsx`：移除姓名列的 `SendMessageButton`；查詢他人視角所需的好友狀態（`isFriend`）；在學習進度區塊下方插入新操作按鈕元件。
  - 新增一個 client 元件（放在 `components/conversation/` 或 `components/community/`，沿用既有命名風格），封裝「加好友 → 成功後切換為傳訊息」的互動，重用 `addFriendByUserId`（`app/actions/friendship.ts`）與 `SendMessageButton`。
- **i18n**：`studentProfile` 命名空間新增「加好友」按鈕文案與成功/失敗提示（傳訊息文案沿用既有 `conversation.cardMessage`）。
- 不涉及資料庫 schema 變更；不涉及 Server Action 新增（純前端串接既有 action）。
