## Context

`app/[locale]/(user)/user/[spiritId]/page.tsx` 第 212 行，在基本資料姓名列直接渲染：

```tsx
{!isOwnPage && <SendMessageButton targetUserId={user.id} label={tConversation('cardMessage')} />}
```

好友功能已存在且成熟：`app/actions/friendship.ts` 的 `addFriendByUserId(targetUserId)`（建立好友關係＋通知對方）、`lib/data/friendship.ts` 的 `isFriend(ownerId, friendId)`（查詢是否已是好友）。既有的 `components/match-board/student-matching-list.tsx` 已實作「依好友狀態切換加好友／傳訊息按鈕」的 client 互動模式，可直接比照。

## Goals / Non-Goals

**Goals:**
- 把「傳訊息」操作移到更合理的位置（學習進度區塊下方），並補上「加好友」入口。
- 重用既有 action／元件，不新增後端邏輯。

**Non-Goals:**
- 不調整好友系統本身的行為（單向、免同意、重複加好友視為已是好友皆維持現狀）。
- 不處理「取消好友」——該操作既有的入口在「社群／好友」頁籤，本次不重複提供。

## Decisions

### 1. 新增 `ProfileFriendActions` client 元件（`components/conversation/profile-friend-actions.tsx`）

封裝單一目標使用者的「加好友／傳訊息」切換邏輯，props：`targetUserId: string`、`initialIsFriend: boolean`、`addFriendLabel: string`、`messageLabel: string`。內部維護 `isFriendState`，呼叫 `addFriendByUserId` 成功後翻轉為 `true` 並 toast 成功；失敗 toast 錯誤訊息。已是好友時直接渲染既有 `SendMessageButton`。

選擇獨立新元件而非直接修改 `student-matching-list.tsx` 內的邏輯：後者是「清單」元件（一次渲染多位學員），本頁只需單一使用者的版本，介面不同（props 為單一 `targetUserId` 而非陣列），抽成清單元件內部 helper 會增加不必要的耦合；兩處都各自呼叫同一個 `addFriendByUserId` action，核心邏輯沒有重複。

### 2. 好友狀態查詢：頁面 Server Component 端一次查好，傳給 client 元件

比照頁面現有風格（`isOwnPage`、`identityTags` 等皆由 server 端算好傳入），在 `page.tsx` 於 `!isOwnPage` 時呼叫 `isFriend(session.user.id, user.id)`，結果作為 `initialIsFriend` 傳入新元件，避免多一次 client-side 請求。

### 3. 按鈕位置：學習進度區塊（`CourseProgressCards`）下方，僅他人視角顯示

```tsx
<div className="pt-1">
  <span>...學習進度...</span>
  <CourseProgressCards ... />
</div>
{!isOwnPage && (
  <ProfileFriendActions targetUserId={user.id} initialIsFriend={isFriendWithUser} ... />
)}
```

與原本緊貼姓名的位置相比，使用者滑到此處已先看過身分與學習進度，再決定是否加好友／傳訊息，動線更合理；且脫離姓名列可避免手機窄螢幕上姓名列被按鈕擠壓換行（`course-page-header-layout` 既有版面慣例：標籤/按鈕獨立成行）。

## Risks / Trade-offs

- 低風險：純前端位置調整＋重用既有 action，不產生新的資料存取路徑或權限變化。
