## Why

學員專屬頁面（`/user/[spiritId]`）目前的「已完成課程」顯示所有 enrollment，未區分課程是否已結業，導致尚在進行中的課程也被列為「已完成」。同時以純文字列表呈現，缺乏視覺結構。需改為三個狀態分區，並統一使用課程卡片元件。

## What Changes

- 學員頁面的課程區塊改為三個狀態分組：**申請中**（pending）、**已開課**（approved + 課程未結業）、**已結業**（approved + 課程已結業）
- 各分組以 `CourseSessionCard` 卡片清單呈現，取代現有純文字列表
- 新增 data layer 查詢函數，取得學員的 enrollments 並附帶課程狀態（completedAt、cancelledAt）
- 已取消課程的申請不顯示（對學員不相關）

## Capabilities

### New Capabilities

- `student-course-list`: 學員課程三狀態列表 — 在學員專屬頁面以卡片分組顯示申請中、已開課、已結業課程

### Modified Capabilities

- （無）

## Impact

**受影響的檔案：**

| 檔案 | 修改內容 |
|------|---------|
| `lib/data/course-sessions.ts` | 新增 `getMyEnrollments(userId)` 查詢，回傳 enrollments 含 invite 狀態欄位 |
| `app/(user)/user/[spiritId]/page.tsx` | 課程區塊改為三分組 + CourseSessionCard |

**無資料庫 schema 變更**。`CourseSessionCard` 元件已存在，可直接複用。
