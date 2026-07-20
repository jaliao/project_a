# Tasks: cr-spec-260720-002 後台會員詳情顯示招生中課程

## 1. 資料層（`lib/data/members.ts`）

- [x] 1.1 學習紀錄 `inviteEnrollments.where`：移除 `invite.startedAt` 過濾，改為 `{ status: 'approved' }`
- [x] 1.2 學習紀錄排序：`orderBy: { invite: { startedAt: { sort: 'desc', nulls: 'first' } } }`
- [x] 1.3 授課紀錄 `courseInvites.where`：移除 `startedAt` 過濾（查全部）
- [x] 1.4 授課紀錄排序：`orderBy: [{ startedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }]`

## 2. 文件與版本

- [x] 2.1 `doc/管理者操作手冊.md`：會員詳情頁學習/授課紀錄描述改為「含招生中課程」；更新檔首版本
- [x] 2.2 `config/version.json` patch +1；README-AI.md 同步

## 3. 驗證

- [x] 3.1 `npm run build` 與 `npm run lint` 通過
- [x] 3.2 手動驗證：會員頁 `/admin/members/[id]` 可見招生中課程卡片（含 `21e2cd17-4719-4cc8-8702-9c7e453f7088`）、排序招生中在前、待審核報名不顯示
