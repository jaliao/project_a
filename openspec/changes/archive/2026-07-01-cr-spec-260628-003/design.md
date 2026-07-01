## Context

- 「結業證書」＝已結業報名（`InviteEnrollment.graduatedAt != null`）。既有 `getMyCompletionCertificates` 以 `courseCatalogId` **去重**（每人每階層一張，取最新），本變更沿用此「人×階層」單位。
- `courseCatalogId` 位於 `CourseInvite`（非 `InviteEnrollment`），故無法直接對報名做 Prisma `groupBy(courseCatalogId)`。
- 後台清單有搜尋/分頁可循模式（members、notifications：`PAGE_SIZE` + `searchParams`）。
- 課程階層：`CourseCatalog`（1 啟動靈人 / 2 啟動豐盛 / 3 啟動得勝）。

## Goals / Non-Goals

**Goals:**
- 後台 `/admin/certificates` 依「人×階層去重」列出應製作證書；標記完成（日期＋管理者）、可還原、每張可備註。
- 篩選預設未完成、可查已完成；人名搜尋；每頁 30 筆分頁。

**Non-Goals:**
- 不改結業流程本身、不自動產生 PDF/實體檔。
- 不做結業撤銷連動（撤銷結業屬既有範圍外）。
- 不做 i18n（後台繁體）。

## Decisions

1. **資料模型**（新檔 `prisma/schema/certificate.prisma`）：
   `CertificateProduction { id、userId(@db.Uuid)、courseCatalogId Int、producedAt DateTime?、producedById String?(@db.Uuid)、note String?、createdAt、updatedAt、@@unique([userId, courseCatalogId]) }`。
   關聯：`user User @relation("CertOwner")`、`producedBy User? @relation("CertProducedBy")`；於 `User` 補兩個反向關聯欄。migration `add_certificate_production`。
   `producedAt != null` ＝已完成製作。
2. **待製作清單查詢**（`lib/data/certificate.ts`）：以「人×階層去重」為單位。考量 `courseCatalogId` 在關聯上、且結業資料量屬中小規模，採**取出全部已結業報名（select userId、invite.courseCatalogId、graduatedAt、user 顯示名/啟動編號）→ 於 JS 依 `(userId,courseCatalogId)` 去重（取最新 graduatedAt）** 形成 eligible 清單；再左接 `CertificateProduction`（依 unique 取狀態/日期/管理者/備註）。狀態篩選、人名搜尋、排序、分頁（30/頁）於彙整後套用並回傳 `{ items, total, totalPages }`。（資料量放大時可改為 raw SQL groupBy＋分頁。）
3. **狀態語意**：未完成＝eligible 中 `producedAt` 為 null（含尚無製作紀錄者）；已完成＝`producedAt != null`。預設 `status=pending`。
4. **Server Actions**（`app/actions/certificate.ts`，`canAccessAdmin` 守衛）：
   - `markCertificateProduced({ userId, courseCatalogId })` → upsert（unique）設 `producedAt=now()`、`producedById=session.user.id`。
   - `unmarkCertificateProduced({ userId, courseCatalogId })` → 設 `producedAt=null`、`producedById=null`（還原）。
   - `updateCertificateNote({ userId, courseCatalogId }, note)` → upsert 設 `note`（trim，空存 null）。
   - 皆 `revalidatePath('/admin/certificates')`、回傳 `ActionResponse`。
5. **頁面**（`app/[locale]/(admin)/admin/certificates/page.tsx`，server component）：`searchParams { status?='pending', q?, page?='1' }`。表格欄：姓名（`getMemberDisplayName`）＋啟動編號、階層（catalog label）、結業日、狀態、製作日期、製作管理者、備註、操作。操作與備註為 client 小元件呼叫 4 的 actions。分頁沿 notifications 樣式。
6. **導覽**：後台功能格/側欄新增「證書製作」入口。
7. 純後台、繁體（非 i18n）。

## Risks / Trade-offs

- **去重 key 選擇**：以 `(userId, courseCatalogId)` 為證書身分；同人同階層跨多班只一張（符合去重決定）。狀態存於 `CertificateProduction`（非某一 enrollment），避免「哪一筆報名持有狀態」的歧義。
- **JS 記憶體去重**：需載入全部已結業報名；於現行規模（數百～數千筆）可接受；規模放大時改 raw SQL。
- `User` 需新增兩個對 `CertificateProduction` 的反向關聯（Prisma 雙向關聯要求），屬 schema 既有慣例。
- migration 為新增表，非破壞性。
- 「可還原」清空 `producedAt/producedById` 但保留 `note`（備註不因還原消失）。
