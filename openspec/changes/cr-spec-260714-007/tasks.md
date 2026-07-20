# Tasks: cr-spec-260714-007 後台學員頁面優化

## 1. 資料層

- [x] 1.1 `lib/data/members.ts` `getMemberDetail`：頂層 select 補 `birthYear`
- [x] 1.2 `getMemberDetail`：`inviteEnrollments.invite` 與 `courseInvites` 補 select 卡片所需欄位——`courseDate`、`maxCount`、`expiredAt`、`cancelledAt`、`completedAt`、報名人數 `_count`（計數條件比照既有卡片使用處，如 dashboard／開課查詢）

## 2. 頁面呈現

- [x] 2.1 基本資料分頁新增「年齡」欄位：`當年西元年 − birthYear`，顯示 `NN 歲`；`birthYear` 為 null 顯示 `—`
- [x] 2.2 學習紀錄：`<table>` 改為 `CourseSessionCard`（`variant="compact"`）卡片牆，`grid gap-4 sm:grid-cols-2`，`href={/course/${inviteId}}`；空狀態文案「尚無學習紀錄」維持
- [x] 2.3 授課紀錄：同 2.2 改卡片牆；空狀態文案「尚無授課紀錄」維持

## 3. 驗證

- [x] 3.1 `npm run lint` 與 `npm run build` 通過
- [x] 3.2 手動驗證：有/無 `birthYear`、有/無學習與授課紀錄的會員詳情頁呈現，卡片點擊導向 `/course/{inviteId}`，手機單欄/桌機兩欄

## 4. 文件與版本

- [x] 4.1 更新 `doc/管理者操作手冊.md` 會員詳情頁章節（年齡欄位、紀錄卡片化），檔首版本標註與日期
- [x] 4.2 `config/version.json` patch +1 並更新 `updatedAt`
- [x] 4.3 依 `.ai-rules.md` 更新 `README-AI.md`
