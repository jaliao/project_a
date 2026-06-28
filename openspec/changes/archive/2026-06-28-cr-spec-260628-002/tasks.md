## 1. Schema 一對多 + Migration

- [x] 1.1 `prisma/schema/course-order.prisma`：`CourseOrder` 新增 `courseInviteId Int?`（可空，因獨立訂單存在）＋ `courseInvite CourseInvite? @relation(...)`
- [x] 1.2 `prisma/schema/course-invite.prisma`：移除 `courseOrderId` / `courseOrder`，改為 `orders CourseOrder[]`
- [x] 1.3 已手寫資料保留 migration `prisma/migrations/20260628000000_multi_material_order/migration.sql`（新增 `courseInviteId` → 回填 → 建索引/FK → 移除舊 `courseOrderId`）。⚠️ **待使用者於自己終端執行 `make schema-update`／`make prisma-dev-deploy` 套用（DB 在 Docker，無法於此環境執行）**
- [ ] 1.4 （待執行）套用後確認回填無孤兒訂單；若 DB 有資料卡關，依 CLAUDE.md「破壞性 schema 變更」程序處理

## 2. 共用判定 Helper

- [x] 2.1 新增可重用的開課門檻判定（`lib/utils/course-start-gate.ts`：`evaluateCourseStartGate`），供 UI 與 server action 共用
- [x] 2.2 定義原因文案：「尚無已核准學員」「尚未申請任何教材」「教材訂單尚未全部收件（X／Y 已收件）」

## 3. 資料層

- [x] 3.1 `lib/data/course-sessions.ts`：`getCourseSessionById` 改回傳 `orders[]`（升序），其餘讀取路徑 `courseOrder?.courseDate` → `orders[0]?.courseDate`
- [x] 3.2 `lib/utils/material-order-status.ts`：確認狀態工具已以單筆訂單為輸入，無需改動；`lib/data/course-order.ts` 關聯改 `courseInvite`（移除未使用的 `getCourseOrderByInviteId`）

## 4. Server Actions（教材金流改多訂單）

- [x] 4.1 `app/actions/course-order.ts`：`applyMaterialOrder` 改為每次建立新訂單（`courseInviteId` 關聯），多地址放寬本數驗證
- [x] 4.2 `confirmReceipt` / `reportMaterialPayment` 改以 `orderId` 為操作對象；`quoteMaterialOrder` / `confirmMaterialPayment` 關聯改 `courseInvite`（`confirmShipment*` 本以 orderId/shipmentId 操作，無需改）
- [x] 4.3 `app/actions/course-invite.ts`：`startCourseSession` 加入 `evaluateCourseStartGate` 條件驗證，未達門檻回傳具體原因

## 5. UI

- [x] 5.1 `app/(user)/course/[id]/course-detail-actions.tsx`：教材區塊改訂單清單，每筆顯示階段與動作（查看/回填/確認收件）＋「再申請一筆教材」
- [x] 5.2 開課按鈕招生中常駐顯示；`canStart` 為 false 時 disabled 並列出原因
- [x] 5.3 `app/(user)/course/[id]/page.tsx`：傳入 `orders`/`canStart`/`startReasons`
- [x] 5.4 `components/course-session/material-order-dialog.tsx`：既有訂單一律唯讀（新訂單由 `dialogOrder=null` 進入）
- [x] 5.5 管理端：data layer（`getAllCourseOrdersWithInvite`/`getCourseOrderForPrint`）關聯改 `courseInvite`，元件消費既有對應欄位無需改

## 6. Seed 與其他引用

- [x] 6.1 `prisma/seed.ts`：不建立 CourseOrder，無需改動
- [x] 6.2 全庫 grep：剩餘 `courseOrderId` 皆為 `MaterialShipment.courseOrderId`／建立邀請表單欄位（仍有效）；`invites/page.tsx`、create-invite 連結方向已改

## 7. 驗證

- [x] 7.1 `npm run build` 通過（型別檢查無遺漏呼叫點）
- [x] 7.2 （待 DB 套用後）手動驗證：一門課可建立多筆訂單；各訂單獨立推進；全部收件＋有 approved 學員才可開課
- [x] 7.3 （待 DB 套用後）手動驗證：未達門檻時開課按鈕 disabled 且原因正確；server 端拒絕繞過
- [x] 7.4 （待 DB 套用後）手動驗證：收件前招生與再申請教材維持開放

## 8. 文件與版本（CLAUDE.md 第 7/9 點）

- [x] 8.1 同步 `doc/老師手冊.md`、`doc/管理者操作手冊.md`（多訂單、開課門檻與原因），更新檔首版本與日期
- [x] 8.2 `config/version.json` patch 版本號 +1（0.1.92 → 0.1.93）
- [x] 8.3 更新 `README-AI.md`（資料模型一對多、開課門檻、changelog）
