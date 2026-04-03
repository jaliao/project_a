## Why

管理者目前只能透過 `/course-sessions` 看到自己建立的開課，無法一覽全站所有開課。
需要一個專屬後台入口，讓 admin/superadmin 能搜尋、篩選、管理全部開課記錄。

## What Changes

- 新增 `app/(user)/admin/course-sessions/` 後台開課管理頁（顯示全站所有開課）
- 頁面標題改為「開課管理」
- 顯示總筆數，預設列出最新 30 筆，按開課日期排列（courseDate desc，null 排最後）
- 支援文字搜尋（課程名稱、講師名字、學員名字），以 URL `?q=` 傳遞
- 支援下拉篩選：課程名稱（CourseCatalog label）、進度（status）、開課日期區間（startDate/endDate）
- 課程卡片點擊以 `target="_blank"` 另開視窗
- `app/(user)/admin/page.tsx`：「授課管理」卡片連結改為 `/admin/course-sessions`
- `lib/data/course-sessions.ts`：新增 `getAllCourseSessionsAdmin()` 查詢（支援篩選參數）

## Capabilities

### New Capabilities
- `admin-course-sessions`：後台開課管理頁，顯示全站開課，支援搜尋 + 篩選 + 排序，點擊另開視窗

### Modified Capabilities
（無）

## Impact

- `app/(user)/admin/course-sessions/page.tsx` — 新增（Server Component）
- `app/(user)/admin/course-sessions/course-sessions-filter.tsx` — 新增（Client Component，搜尋列 + 篩選下拉）
- `lib/data/course-sessions.ts` — 新增 `getAllCourseSessionsAdmin()` 查詢
- `app/(user)/admin/page.tsx` — 更新「授課管理」卡片連結
- `components/course-session/course-session-card.tsx` — 確認是否支援 `target="_blank"`（或透過 `<a>` 包裝）
