# 廢除課程清單頁面 /course-sessions

## Why

「開課查詢頁」`/course-sessions` 已是孤兒頁——站內（topbar、各頁面）無任何連結指向它，其功能（列出自己的課程）已完全由個人頁的「我的授課」（`/user/[spiritId]/courses`）承接。留著只是維護負擔與混淆來源。

## What Changes

- **BREAKING** 刪除使用者端頁面 `app/[locale]/(user)/course-sessions/page.tsx`；直接輸入網址命中 `/course-sessions` 顯示友善 404（比照 `/learning` 廢頁前例，不設轉導）。
- 移除僅此頁使用的 i18n key `course.sessions.*`（zh-TW／en；zh-CN 重新產生）。
- **保留**：`CourseSessionCard` 元件（match-board、個人頁、我的授課仍使用）、`lib/data/course-sessions.ts`（`getMyCourseSessions` 等仍被多處使用）、後台 `(admin)/admin/course-sessions`（不同頁面，不在範圍）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-sessions-list`: **整個 capability 廢除**（三條 requirements 全數 REMOVED：路由、顯示全部記錄、標題與返回連結）。

## Impact

- **程式碼**：刪除 `app/[locale]/(user)/course-sessions/`（僅 page.tsx）；`messages/zh-TW.json`、`messages/en.json` 移除 `course.sessions` 區塊。
- **文件**：三份手冊皆未提及「開課查詢」頁，無需修改；version.json patch +1；README-AI 更新。
- **不影響**：`CourseSessionCard`、`lib/data/course-sessions.ts`、後台課程管理、我的授課頁。
