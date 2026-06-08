## Why

目前課程（CourseInvite）僅能透過邀請連結或直連報名，講師無法公開招募學員，有意參加的會員也沒有地方瀏覽「正在招生」的課程。需提供「公開媒合」機制與媒合布告欄，讓講師選擇公開課程並填寫招募說明，會員可在布告欄找到並前往報名。

## What Changes

- **BREAKING（schema）**：`CourseInvite` 新增 `isPublicMatch Boolean @default(false)`（是否公開媒合，預設不公開）與 `matchNote String?`（公開招募備註），需 migration。
- **開課時設定公開媒合**：開課精靈／表單新增「公開媒合」開關（預設關閉）；開啟時可填寫「公開招募備註」。
- **課程詳情頁可修改**：講師可於自己的課程詳情頁切換公開媒合開關、編輯／清除招募備註。
- **媒合布告欄頁面**：新增布告欄頁面，列出符合條件的公開課程（公開、未取消、招募中），以**既有標準課程卡片**呈現，並附上招募備註。
- **右上角入口**：Topbar 右上角新增「媒合布告欄」按鈕，所有登入會員皆可進入。

## Capabilities

### New Capabilities
- `course-public-matching`: 公開媒合資料模型（`isPublicMatch`／`matchNote`）、媒合布告欄頁面與顯示規則（公開＋未取消＋招募中、課程卡片＋備註）、開課與詳情頁的公開媒合設定行為。

### Modified Capabilities
- `create-course-wizard`: 開課流程新增「公開媒合」開關（預設關）與招募備註欄位。
- `course-session-detail`: 講師專屬新增「切換公開媒合／編輯招募備註」。
- `topbar`: 右上角新增「媒合布告欄」入口按鈕。

## Impact

- **資料模型**：`prisma/schema/course-invite.prisma`（+`isPublicMatch`、+`matchNote`）+ migration。
- **開課**：`lib/schemas/course-session.ts`（新增欄位驗證）、`app/actions/course-session.ts`（建立時寫入）、開課精靈表單元件。
- **詳情頁**：`app/(user)/course/[id]/` 詳情頁與講師操作元件；新增 Server Action（如 `updateMatchSettings(inviteId, { isPublicMatch, matchNote })`，僅課程講師可呼叫）。
- **布告欄**：新增頁面（如 `app/(user)/match-board/page.tsx`）+ 資料查詢（`lib/data/` 列出公開招募中課程）；重用 `CourseSessionCard` 並顯示 `matchNote`。
- **入口**：`components/layout/topbar.tsx` 新增按鈕（所有登入會員可見）。
- **不影響**：既有邀請連結／直連報名流程不變；非公開課程行為不變。
