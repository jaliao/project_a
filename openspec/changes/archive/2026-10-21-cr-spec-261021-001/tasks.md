## 1. 查證與清單產出

- [x] 1.1 開啟正式環境 SSH tunnel（GCP tunnel，localhost:25432）
- [x] 1.2 以唯讀 SQL 查出 `churchType=none` 的學員中，存在至少一筆 `InviteEnrollment` 的清單，依 `joinedAt` 取每位學員最新一筆報名，JOIN 出對應 `CourseInvite.createdById` 老師與其 `churchType`/`churchId`/`churchOther`
- [x] 1.3 篩掉老師本身也是 `churchType=none` 的列
- [x] 1.4 列出最終受影響清單規模供使用者確認：共 945 筆（其中 11 筆對應老師為 churchOther 自填教會），剩餘 85 筆無符合條件老師不處理

## 2. 執行回填（已於正式環境執行，2026-10-21）

- [x] 2.0 執行前以 `pg_dump -F c` 備份正式環境整庫至 `backups/prd_backup_20261021_164254_pre_church_backfill.sql`（已用 `pg_restore --list` 驗證可還原）
- [x] 2.1 先在交易內執行 UPDATE 後 ROLLBACK（dry-run），確認影響筆數為 945 與查證一致後，正式執行並 COMMIT
- [x] 2.2 執行後以 SELECT 覆核：`churchType=none` 由 1030 筆降為 85 筆；重新查詢「仍為 none 但本應回填」條件結果為 0 筆
- [x] 2.3 確認未誤動其他資料列：近 10 分鐘內 `updatedAt` 變動筆數剛好等於 945，與本次異動筆數一致

## 3. 驗證

- [x] 3.1 以 SQL 抽樣核對受影響學員的 `churchType`/`churchId`/`churchOther` 與其對應老師一致（查證邏輯見 2.2）
- [x] 3.2 後台 dashboard 教會分布圖表數字較執行前有對應增加：比對 `lib/data/dashboard.ts` 使用的聚合邏輯（`groupBy churchId, where churchType='church'` + `count churchType='other'/'none'`），執行後 `church=1611`／`other=64`／`none=85`，與回填筆數吻合
