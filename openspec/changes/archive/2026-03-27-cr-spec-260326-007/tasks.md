## 1. 通知工具函數

- [x] 1.1 在 `app/actions/notification.ts` 新增 `createNotification(userId, title, body)` 函數，直接呼叫 prisma 寫入 notifications 資料表
- [x] 1.2 確認函數為 server-only（已在 `'use server'` 模組中），不 export 給 client

## 2. 開課完成通知

- [x] 2.1 修改 `app/actions/course-session.ts` — `createCourseSession` 成功後以 try/catch 呼叫 `createNotification`，通知開課教師，內容含課程名稱與預計開課日期

## 3. 課程操作通知

- [x] 3.1 修改 `app/actions/course-invite.ts` — `cancelCourseSession` 成功後呼叫 `createNotification`，通知開課教師，內容含課程名稱與取消原因
- [x] 3.2 修改 `app/actions/course-invite.ts` — `graduateCourse` 成功後呼叫 `createNotification`，通知開課教師，內容含課程名稱
- [x] 3.3 修改 `app/actions/course-invite.ts` — `approveEnrollment` 成功後呼叫 `createNotification`，通知**申請學員**（非操作者），內容含課程名稱

## 4. 版本與文件

- [x] 4.1 更新 `config/version.json` patch 版本號 +1
- [x] 4.2 更新 `README-AI.md` 反映通知整合架構
