## Why

學員結業後需製作**實體結業證書**，目前系統無工具追蹤「哪些人的證書已製作／未製作」，管理者只能人工比對結業名單。需提供後台清單集中管理製作狀態、製作日期、製作管理者與備註，並能快速篩出待製作者。

## What Changes

- 新增後台頁 `/admin/certificates`「實體證書製作管理」：
  - 清單以**每人每階層一張**（`userId × courseCatalogId` 去重）呈現「應製作證書」名單，來源為已結業報名（`graduatedAt` 不為 null）。
  - **標記已完成製作**：寫入製作日期、製作管理者、（備註）；**可還原**（取消完成）。
  - **篩選**：預設顯示**未完成**；可切換查詢**已完成**。
  - **人名搜尋**（顯示名／中文姓名等）。
  - **分頁**每頁 30 筆。
  - **每張證書可加備註**（可編輯）。
- 新增 `CertificateProduction` 模型（唯一鍵 `userId × courseCatalogId`）承載製作狀態/日期/管理者/備註（migration）。
- 後台導覽新增「證書製作」入口。

## Capabilities

### New Capabilities

- `admin-certificate-production`: 後台實體證書製作管理——依已結業（人×階層去重）產生待製作清單，支援標記完成/還原、製作日期與管理者紀錄、備註、未完成/已完成篩選、人名搜尋、每頁 30 筆分頁。

### Modified Capabilities

（無）

## Impact

- `prisma/schema/course-order.prisma` 或新 schema 檔：新增 `CertificateProduction` 模型（`userId`、`courseCatalogId`、`producedAt?`、`producedById?`、`note?`、`@@unique([userId, courseCatalogId])`）→ migration
- `app/[locale]/(admin)/admin/certificates/`（清單頁：篩選＋搜尋＋分頁）＋ `components/admin/*`（列/標記元件）
- `lib/data/`（待製作清單查詢：由結業報名去重＋左接製作紀錄）
- `app/actions/`（標記完成／還原／更新備註 server actions，`canAccessAdmin` 守衛）
- 後台導覽/首頁功能格新增入口
- `doc/管理者操作手冊.md`、`config/version.json`、README-AI
- 純後台、繁體（非 i18n 範圍）
