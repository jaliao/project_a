## Context

`MaterialOrderTable`（`components/admin/material-order-table.tsx`）是既有 536 行的 client component，接收伺服器已一次查好的完整 `orders: CourseOrderWithInvite[]`，內含展開/收合、批價對話框、確認收款/寄送等既有互動邏輯，皆為前端 state（無 URL 參數）。本次分頁籤採同一模式（前端 state 篩選），不引入 URL 參數，理由見 Decisions。

列表目前「講師」欄位（`order.instructorName` + `order.instructorEmail`）資料來自 `CourseInvite.createdBy`（該課程的建立者/講師帳號），與訂單自身欄位 `order.teacherName`（購買人於申請表單自填的教師姓名，可能與實際帳號不同、不保證存在對應會員）是兩個不同來源、語意也不同的欄位——本次新增的「會員標籤」對應的是前者（`CourseInvite.createdBy`，真實會員帳號），`order.teacherName` 欄位維持既有純文字顯示不變。

身分標籤（識別會員是否為系統管理員／哪些書籍講師）目前的計算邏輯內嵌於 `app/[locale]/(user)/user/[spiritId]/page.tsx`（`canAccessAdmin` + 逐一檢查 `TEACHER_ROLES`），非共用函式。`MemberTag` 需要相同邏輯，抽出為共用函式是自然的最小重構。

## Goals / Non-Goals

**Goals:**
- 教材申請列表可依進度（全部／待處理／已完成）快速篩選。
- 講師 Email 不再於列表無謂曝光。
- 建立可重用的後台「會員標籤」元件，本次於教材申請詳情套用，未來其他後台頁面（例如提問管理、會員審核）有類似「顯示某會員摘要並可檢視/聯繫」的需求時可直接重用，不必重新設計。

**Non-Goals:**
- 不做伺服器端分頁籤篩選查詢（見 proposal Non-Goals）。
- 不重新設計既有列表欄位／展開詳情版面之外的其他部分。
- 不處理「會員標籤」在其他既有頁面的套用（僅新增元件本身與教材詳情這一處用法）。

## Decisions

### 分頁籤：前端 state 篩選，不用 URL 參數
與 `settings-tabs.tsx`（`?tab=` URL 驅動、伺服器依 tab 重新查資料）不同，本次資料集（`orders`）已在頁面層一次查完並整包傳入 client component，且既有互動（展開/收合、批價彈窗）皆是前端 state，沒有伺服器重新查詢的需求。改用 URL 參數只會多一層路由同步成本，換不到實質好處，故採 `useState<'all' | 'pending' | 'completed'>('all')`，於既有 `orders.map(...)` 前先 `.filter()`。

### 「待處理／已完成」狀態分組
與提出人確認：「待處理」＝除「已完成」外全部（待批價、待付款、待確認收款、待寄送），「已完成」＝已寄送、已收件。二分不遺漏任何 `MaterialOrderStatusKey`。判斷邏輯：
```ts
const isCompleted = (key: MaterialOrderStatusKey) => key === 'shipped' || key === 'received'
```

### `MemberTag` 資料來源：由呼叫端組好 `MemberTagInfo`，元件本身不查詢
`MemberTag` 是純展示元件（`{ id, spiritId, roles, displayName, avatarUrl } | null`），不自行呼叫任何 data layer 函式或 Server Action（唯一的互動——開啟訊息 Drawer——透過既有 `useMessageDrawer()` hook，非新的 Server Action）。資料由 `getAllCourseOrdersWithInvite` 已展開的 `courseInvite.createdBy` select 組出，`displayName` 用 `getMemberDisplayName()`、`avatarUrl` 用既有 `resolveAvatarUrl()` 預先算好放進 `CourseOrderWithInvite.instructor`，元件收到的就是可直接渲染的資料，不必自己再組一次（與 `lib/data/conversation.ts` 既有的 `ConversationParticipantInfo` 模式一致）。

### 身分標籤邏輯抽出為 `lib/utils/identity-tags.ts`
```ts
export function getIdentityTags(roles: Roles): string[] {
  const tags: string[] = []
  if (canAccessAdmin(roles)) tags.push('系統管理員')
  for (const role of TEACHER_ROLES) {
    if (roles.includes(role)) tags.push(ROLE_LABELS[role])
  }
  return tags
}
```
`app/[locale]/(user)/user/[spiritId]/page.tsx` 既有的內嵌邏輯改呼叫此函式（純重構、輸出不變，不影響行為契約，故不列入 `student-profile-page` 之類既有 capability 的 spec 變更——這是實作細節層級的整理）。

### 「檢視」「訊息」按鈕樣式
沿用既有 `components/admin/support-inquiry-card.tsx` 的 `Link` + `target="_blank"` + `IconExternalLink` 慣例（開新分頁導向 `/admin/members/{id}`，與後台既有導覽習慣一致，避免管理者處理教材申請時原分頁被導離）；「訊息」按鈕比照 `SendMessageButton` 呼叫 `openMessageDrawer(userId)`，但因版面需求為純圖示（`IconMessage`，無文字 label），不直接重用 `SendMessageButton`（其固定含文字 label），改在 `MemberTag` 內部直接呼叫 hook。

### 無關聯講師時不顯示會員標籤區塊
獨立訂單（`order.instructor === null`）維持現狀，不顯示「會員標籤」區塊（不顯示破折號佔位版本的元件），因為完全沒有會員可供檢視/聯繫，顯示空殼元件沒有意義；與既有「課程編號」欄位對獨立訂單顯示「—」的處理方式不同調，屬合理差異（那是純文字欄位一定要有內容占位，這是整塊互動元件，沒資料就不需要占位）。

## Risks / Trade-offs

- [風險] `getAllCourseOrdersWithInvite` 的 select 擴大（多查 `roles`／`avatarKey`／`image` 等欄位），對效能影響極小（同一次查詢多幾個純欄位，非新增 join 或 N+1）。
- [風險] 前端篩選在訂單量極大時（數千筆以上）可能有渲染效能疑慮 → Mitigation：已列為 Non-Goal 記錄，非本次要解決的問題，現階段資料量遠低於此門檻。
- [風險] `instructorName`（列表既有姓名來源，`realName ?? name`）與 `MemberTag.displayName`（`getMemberDisplayName`，暱稱優先）計算邏輯不同，同一位講師在「收合列表」與「展開詳情的會員標籤」可能顯示不同名稱 → Mitigation：本次刻意不動 `instructorName`（維持既有行為、避免無關範圍的改動），此不一致為已知、可接受的既有落差，非本次引入的新問題，如需統一可另開 CR。
