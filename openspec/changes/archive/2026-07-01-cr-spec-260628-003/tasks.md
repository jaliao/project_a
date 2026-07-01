## 1. 資料模型與 migration

- [x] 1.1 新增 `prisma/schema/certificate.prisma`：`CertificateProduction`（`userId`、`courseCatalogId`、`producedAt?`、`producedById?`、`note?`、`@@unique([userId, courseCatalogId])`、`@@map`）＋關聯（CertOwner / CertProducedBy / courseCatalog）
- [x] 1.2 `user.prisma` 補反向關聯 `certificates`/`producedCertificates`；`course-catalog.prisma` 補 `certificateProductions`
- [x] 1.3 migration `20260701010000_add_certificate_production` ＋ `prisma generate`（DB 套用見 7.3）

## 2. 資料層（`lib/data/certificate.ts`）

- [x] 2.1 `getCertificateProductionList`：取全部已結業報名 → JS 依 `(userId,courseCatalogId)` 去重（取最新 graduatedAt）
- [x] 2.2 左接 `CertificateProduction`＋套狀態篩選/人名搜尋/排序/分頁（30/頁），回 `{ items, total, totalPages, page, pageSize }`
- [x] 2.3 型別 `CertificateListItem`/`CertificateListResult`

## 3. Server Actions（`app/actions/certificate.ts`，`canAccessAdmin`）

- [x] 3.1 `markCertificateProduced`：upsert 設 `producedAt=now`、`producedById`
- [x] 3.2 `unmarkCertificateProduced`：設 `producedAt/producedById=null`（保留 note）
- [x] 3.3 `updateCertificateNote`：upsert 設 `note`（trim/空存 null/500 上限）
- [x] 3.4 三者 `revalidatePath('/admin/certificates')`＋`ActionResponse`

## 4. 清單頁（`admin/certificates/page.tsx`）

- [x] 4.1 server component，`searchParams { status?='pending', q?, page? }`
- [x] 4.2 表格欄：啟動編號、姓名、階層、結業日、狀態、製作日期、製作管理者、備註、操作
- [x] 4.3 `CertificateFilter`（狀態切換＋人名搜尋，`@/i18n/navigation`）＋分頁（30/頁）
- [x] 4.4 `certificate-cells.tsx`：`CertificateProduceButton`（標記/還原）＋`CertificateNoteCell`（備註）

## 5. 導覽入口

- [x] 5.1 後台功能格新增「證書製作」入口（`IconCertificate` → `/admin/certificates`）

## 6. 文件與版本

- [x] 6.1 `doc/管理者操作手冊.md` 新增「十四、實體證書製作管理」＋權限速查＋TOC＋版本 v0.1.108；老師/學員手冊不受影響
- [x] 6.2 `config/version.json` → 0.1.108；README-AI 當前任務同步

## 7. 驗證

- [x] 7.1 `npm run build`（✓ Compiled，路由已註冊）、`npm run lint`（0 errors）通過
- [x] 7.2 （執行階段，需 DB）去重正確；標記/還原記錄日期與管理者、還原保留備註；預設未完成、可查已完成；人名搜尋；每頁 30 筆
- [x] 7.3 （部署）DB 套用 migration：本機 `make prisma-dev-deploy`；VPS3 `make prisma-vps3-deploy`
