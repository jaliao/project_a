## Context

教材訂購目前的資料模型是「一門課最多一筆教材訂單」：`CourseInvite.courseOrderId Int?` 指向 `CourseOrder`，而 `CourseOrder.courseInvites CourseInvite[]`（反向為一對多，但實務上一筆訂單對一門課）。整條教材金流（`app/actions/course-order.ts` 的 `applyMaterialOrder` / `confirmReceipt` / `confirmShipment`、講師端 `course-detail-actions.tsx`、管理端 `admin/materials/**`、列印頁、`lib/data/course-sessions.ts`）都以 `invite.courseOrderId` 或單一 `courseOrder` 為前提。

「開始上課」按鈕現況（`course-status` spec）：僅在 `courseOrder.receivedAt != null` 時顯示，且 `startCourseSession`（`app/actions/course-invite.ts:311`）只驗證擁有者與狀態旗標，不檢查學員或教材。

本變更要支援「一門課多筆教材訂單、開課前可持續申請」，並把開課門檻改為「≥1 已核准學員 + 所有訂單皆已收件」，按鈕常駐並顯示未達原因。

## Goals / Non-Goals

**Goals:**
- `CourseInvite` 對 `CourseOrder` 改為一對多，講師開課前可持續新增教材訂單。
- 每筆訂單各自獨立跑「申請 → 批價 → 付款 → 寄送 → 收件」。
- 開課門檻：≥1 approved 學員 + 至少一筆訂單且全部 `receivedAt != null` + 課程仍招生中；server 與 UI 同步驗證。
- 開課按鈕常駐，未達門檻時 disabled 並列出具體原因。

**Non-Goals:**
- 不改教材金流各階段本身的規則（批價、付款回填、收款確認、寄送、多地址批次邏輯不變，只是改為「每筆訂單」適用）。
- 不改結業、取消授課流程。
- 不改學員報名/核准的既有規則（招生本就在 `startedAt` 前開放，沿用即可）。
- 不引入「刪除已批價訂單」等新管理動作（除非實作時發現必要，列入 Open Questions）。

## Decisions

**決策 1：schema 改為一對多 —— `CourseOrder.courseInviteId`。**
- `CourseOrder` 新增 `courseInviteId Int?`（**可空**）＋ `courseInvite CourseInvite? @relation(...)`；`CourseInvite` 改為 `orders CourseOrder[]`，移除 `courseOrderId` / `courseOrder`。
- 一門課可有多筆訂單；FK 設可空是因為既有 `createCourseOrder`（`course-order-form.tsx`）會建立**未關聯任何課程**的獨立訂單，必須容許 `courseInviteId = null`。
- 「全部收件」門檻只計算 `courseInviteId = 該課程` 的訂單，獨立訂單不影響。
- *替代方案*：必填 FK → 否決，會破壞獨立訂單流程；保留 `courseOrderId` 另開 join 表 → 否決，多餘且查詢繁瑣。

**決策 2：migration 回填既有關聯（資料保留）。**
- 新增可空 `courseInviteId` → 以既有 `CourseInvite.courseOrderId` 反向回填（`UPDATE course_orders o SET course_invite_id = i.id FROM course_invites i WHERE i.course_order_id = o.id`）→ 設為 NOT NULL → 移除 `course_invites.course_order_id`。
- 依 CLAUDE.md：以 `make schema-update name=multi_material_order` 建立 migration。若回填後仍有孤兒訂單（無對應 invite）需先檢視，屬破壞性情形時走「先清空 DB 再建 migration」程序。

**決策 3：「全部收件」判定集中於資料層。**
- 在 `lib/data/course-sessions.ts` 課程詳情查詢帶出 `orders`（含 `receivedAt` 等狀態），衍生旗標：
  - `hasAnyOrder = orders.length > 0`
  - `allOrdersReceived = hasAnyOrder && orders.every(o => o.receivedAt != null)`
  - `approvedStudentCount`（已有來源，沿用）
- `canStart = approvedStudentCount >= 1 && allOrdersReceived && 招生中`。

**決策 4：開課門檻原因清單（UI 與 server 共用語意）。**
- 計算未達原因陣列，例如：
  - `approvedStudentCount < 1` → 「尚無已核准學員」
  - `!hasAnyOrder` → 「尚未申請任何教材」
  - `hasAnyOrder && !allOrdersReceived` → 「教材訂單尚未全部收件（X／Y 已收件）」
- 按鈕常駐：`!isStarted` 時一律渲染開課按鈕；`canStart` 為 false 時 `disabled` 並於旁顯示原因清單。

**決策 5：`startCourseSession` server 端同步驗證（單一真相防繞過）。**
- 在現有擁有者/狀態檢查後，加入 approved 學員數與「全部訂單收件」檢查；未達時回傳 `{ success:false, message: <第一個原因或彙整> }`。
- 與 UI 用同一套判定邏輯（抽成可重用 helper，避免兩處邏輯漂移）。

**決策 6：教材申請 UI 改為多訂單清單。**
- 講師端 `course-detail-actions.tsx`：教材區塊由「單一訂單狀態」改為「訂單清單」，每筆顯示自身階段與動作（查看/回填/確認收件）；新增「再申請一筆教材」開啟 `MaterialOrderDialog` 建立**新**訂單（而非編輯舊訂單）。
- 管理端 `admin/materials/**` 與列印頁：以訂單為列（既有多以訂單為單位，主要調整關聯查詢來源）。

## Risks / Trade-offs

- [一對多翻轉牽動面廣，遺漏呼叫點會型別/執行期錯誤] → 全庫 grep `courseOrderId` 逐處改；TypeScript 移除欄位後編譯期可攔截大部分遺漏；`npm run build` 為驗收門檻。
- [migration 回填出錯導致關聯遺失] → 先在 dev 以 seed 資料驗證回填 SQL；保留回滾（還原 schema 與 migration）。正式環境走 `make prisma-dev-deploy` 前先 `prisma-dev-status` 檢查。
- [「全部收件」對「零訂單」的語意誤判] → 明確要求 `hasAnyOrder` 為前提，零訂單時 `canStart=false` 且原因為「尚未申請任何教材」。
- [多訂單後 `materialSummary`（應寄本數）語意改變] → 改為各訂單各自彙整，或課程層加總；實作時以現有列印/寄送單位（訂單）為準。

## Migration Plan

1. 改 `prisma/schema/course-order.prisma` / `course-invite.prisma`（新增 `courseInviteId` 可空 → 回填 → NOT NULL → 移除 `courseOrderId`）。
2. `make schema-update name=multi_material_order` 建立 migration（dev）；於 migration 內加入回填 SQL。
3. 改 actions / data layer / UI / seed，`npm run build` 通過。
4. 部署：`make prisma-dev-status` → `make prisma-dev-deploy`。
5. 回滾：還原 schema 與程式碼、移除該 migration（資料以回填前快照復原）。

## Open Questions

- 已批價或已付款的訂單是否允許講師刪除/作廢？（影響「全部收件」是否可被卡住）目前假設**不提供刪除**，若有需要再追加。
- 多訂單情境下，課程詳情頁「應寄繁/簡本數」彙整要以「課程總計」還是「逐訂單」呈現？暫以逐訂單為主、必要時加課程總計。
