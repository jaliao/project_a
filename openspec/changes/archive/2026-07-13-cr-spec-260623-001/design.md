# 廢除課程清單頁面 /course-sessions — 技術設計

## Context

`/course-sessions`（開課查詢頁）為早期功能，現無任何站內入口；個人課程清單由 `/user/[spiritId]/courses` 承接（同樣使用 `getMyCourseSessions` 與 `CourseSessionCard`）。頁面本身無專屬元件與資料層函式。

## Goals / Non-Goals

**Goals:**
- 刪除頁面與其專屬 i18n key，命中網址走既有友善 404。

**Non-Goals:**
- 不動 `CourseSessionCard`（match-board／個人頁／我的授課共用）。
- 不動 `lib/data/course-sessions.ts`（多處共用）。
- 不動後台 `(admin)/admin/course-sessions`。
- 不設 301/轉導。

## Decisions

1. **直接刪除、命中 404，不轉導**
   比照 `/learning` 廢頁前例（cr-spec-260702-006）：無站內連結、系統未上線無外部書籤存量，設轉導反而殘留維護面積；既有 `not-found.tsx` 提供友善 404＋回首頁。

2. **i18n 僅刪 `course.sessions.*` 三個 key**（metaTitle/title/empty），zh-TW 與 en 同步刪，zh-CN 由 build 重產；刪前 grep 確認無他處引用。

## Risks / Trade-offs

- **[使用者殘留書籤]** → 系統未上線、頁面無入口，機率趨近零；命中亦有友善 404 引導回首頁。

## Migration Plan

無 migration；部署即生效。回滾為還原檔案。

## Open Questions

（無）
