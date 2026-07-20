# Design: cr-spec-260720-001 教材申請內容可修改（版本／數量）

## Context

目前教材申請流程（`applyMaterialOrder`，`app/actions/course-order.ts`）：

- 書本項目由「已核准且 `materialChoice ≠ none`」的報名逐筆推導（`lib/data/material-items.ts`），一筆報名＝一本書 `{ 學員, 書名, 版本 }`。
- **單一地址**：server 端自動取「尚未指派」的全部書本項目寫入訂單，client 完全不能挑選或調整。
- **多地址**：client 送 `shipments[].enrollmentIds` 指派書本至各地址，但版本固定為學員選版，且必須「全數指派、不可重複」。
- Server 以 `computeMaterialProgress` 的剩餘量做硬上限，剩餘 0 時拒絕申請；UI 於剩餘 0 時停用「申請教材」按鈕。
- 授權僅限課程講師（`invite.createdById === session.user.id`）。
- `MaterialShipmentItem.enrollmentId` 為必填外鍵，快照 `bookName`／`version`／`studentName`。

本變更要求：學員選版降為參考依據，老師與管理者可在送出申請前逐本改版本、排除項目、加購額外本數；管理者於前台課程頁操作（比照班級管理前台化）。系統**已上線、有正式資料**，schema 變更必須相容既有資料。

## Goals / Non-Goals

**Goals:**

- 申請對話框（單一地址與多地址）皆呈現可編輯的逐本清單：改版本（繁↔簡）、取消勾選、新增加購項目。
- 移除「不可超額」上限驗證與「剩餘 0 停用按鈕」限制；開課前恆可申請（含純加購）。
- 管理者可於前台課程頁檢視並執行教材申請；相關 action 授權擴為「講師或管理者」。
- 學員 `materialChoice` 保持不變，僅作為預設值與參考統計。
- 提供「完成教材申請」機制：不需（再）申請教材時可標記完成，通過開課門檻中的教材需求條件。

**Non-Goals:**

- 不改變申請後的金流／寄送／收件流程（批價、付款、確認寄送、收件維持現狀）。
- 不提供「修改已送出訂單」的能力——修改僅發生在送出申請之前；送出後仍以取消訂單重來。
- 不改變學員端選版 UI 與報名流程。
- 後台 `/admin/materials` 不新增申請入口（管理者一律走前台課程頁）。

## Decisions

### D1：申請 payload 改為「明確的書本項目清單」，server 不再自動取全部

單一地址模式改為 client 送出本次申請的項目清單，與多地址共用同一種項目型別：

```ts
type OrderItemInput =
  | { kind: 'enrollment'; enrollmentId: number; version: 'traditional' | 'simplified' } // 學員書（version 可覆寫）
  | { kind: 'extra'; version: 'traditional' | 'simplified'; bookName?: string }          // 加購（不綁學員）
```

- 單一地址：`items: OrderItemInput[]`；多地址：`shipments[].items: OrderItemInput[]`（取代現行 `enrollmentIds`）。
- Server 驗證：`enrollmentId` 必須屬於當下 `getUnassignedBookItems` 範圍且不重複（防並發重複申請）；**移除「全數指派」與「不可超額」檢查**，改為「本次合計至少 1 本」。
- 訂單／批次的 `traditionalQty`/`simplifiedQty` 由送出項目（含覆寫後版本與加購）推導，維持既有推導原則。

替代方案：只開放「繁/簡總量」直接編輯——與逐本項目／多地址按本指派模型衝突，已於 proposal 階段否決。

### D2：加購項目重用 `MaterialShipmentItem`，`enrollmentId` 改為 nullable

```prisma
model MaterialShipmentItem {
  enrollmentId Int?              // 加購項目為 null
  enrollment   InviteEnrollment? @relation(...)
  // bookName / version / studentName 快照欄位不變
}
```

- 加購項目：`enrollmentId = null`，`bookName` 可自填（預設「額外加購」），`studentName` 快照空字串。
- 不另建 model：快照欄位（書名／版本）已齊備，出貨單列印與訂單內嵌顯示可沿用同一清單。
- `getUnassignedBookItems` 的已指派查詢 `where: { enrollment: { inviteId } }` 在 nullable 後語意不變（null 不會 match），加購項目本來就不佔用學員項目。
- 欄位由必填改 optional 屬**放寬型變更**：既有 `material_shipment_items` 資料（`enrollmentId` 皆有值）完全相容，無需回填或轉移；既有訂單顯示行為不變。

### D3：版本覆寫只寫入訂單快照，不回寫學員 `materialChoice`

- 覆寫的版本僅存在 `MaterialShipmentItem.version`（快照）；學員報名的 `materialChoice` 不動，保留「學員申請＝參考依據」語意。
- 後果：`computeMaterialProgress` 的「已申請」可能超過「總需求」——`remaining` 已以 `max(0, …)` 處理，不需改演算法；UI 將統計標示為參考值。

### D4：授權擴為「講師或管理者」，快照一律以課程講師為準

- `applyMaterialOrder` 授權改為 `invite.createdById === session.user.id || canAccessAdmin(actorRoles)`（`lib/auth-roles.ts`）。
- **購買人快照（buyer 欄位）改取自課程講師（`invite.createdBy`）而非操作者**：目前程式取 session user 是因為只有講師能申請；管理者代辦時訂單的購買人／收件預設仍應是講師。`submittedById` 記錄實際操作者以供稽核。
- 課程詳情頁「教材申請作業」區塊的可見／可操作條件由「講師本人」擴為「講師本人或管理者」（沿用班級管理前台化的判定方式）。
- 同批巡檢其餘講師端教材 actions（回填後五碼 `reportMaterialPayment`、確認收件 `confirmReceipt`、取消訂單 `cancelCourseOrder`）：授權同步擴為講師或管理者，維持一致。

### D5：對話框 UI——單一地址補上逐本清單，多地址擴充既有指派列

- **單一地址**：原「系統自動帶入尚未申請的全部」說明文字改為逐本清單（勾選框＋版本下拉），下方顯示「合計：繁 X、簡 Y（學員申請：繁 A、簡 B）」對照。
- **多地址**：既有 `BookAssignList` 逐本指派 UI 增加版本下拉；加購項目以「＋新增一本」列加入某地址的清單。
- 「申請教材」按鈕：課程可操作（未開始／未取消／未結業）即啟用；剩餘 0 時不再停用，僅在說明區顯示「學員申請之教材已全數申請」的參考提示。

### D6：「完成教材申請」以 `CourseInvite.materialFinalizedAt` 時間戳記錄，開課門檻豁免教材需求條件

背景：開課門檻（`lib/utils/course-start-gate.ts`，規格在 `course-status`）目前要求「尚未申請需求＝0 且 所有訂單已收件」。「全班皆不需教材」（總需求 0、無訂單）今日即可開課；但「有學員選了教材、老師/管理者判定不申請」會被 `remaining > 0` 永久卡住開課。

- **資料模型**：`CourseInvite` 新增 `materialFinalizedAt DateTime?`（additive、nullable，正式資料相容；既有課程為 null＝未完成，行為不變）。操作者稽核走既有課程操作 LOG（不另加欄位）。
- **Actions**：新增 `finalizeMaterialOrders(inviteId)` 與 `reopenMaterialOrders(inviteId)`（授權：講師或管理者；限課程未開始／未取消／未結業時可操作），寫入／清空 `materialFinalizedAt` 並記操作 LOG。
- **開課門檻**：`evaluateCourseStartGate` 的教材需求條件改為 `remaining = 0 || materialFinalized`；「所有訂單皆已收件」條件**不變**（已建立的真實訂單仍須走完收件）。已核准學員 ≥1 條件不變。
- **與申請互斥**：已標記完成時，「申請教材」按鈕停用並提示「教材申請已完成」；要再申請須先「重新開放申請」。完成後新核准的學員需求不影響門檻（finalized 豁免），老師可視情況重新開放。
- **全班不需教材情境**：`remaining = 0` 本來就過門檻，不強制按完成——「完成教材申請」為覆寫 `remaining > 0` 的明確意思表示；區塊於總需求 0 時顯示「全班不需教材」提示。

替代方案：直接移除門檻的教材需求條件（學員申請僅參考）——被否決：老師可能尚未處理教材就誤按開課，保留「remaining = 0 或明確按完成」讓意圖顯性化。

## Risks / Trade-offs

- [`enrollmentId` nullable 影響既有讀取路徑] → 巡檢所有 `MaterialShipmentItem` 使用點（`lib/data/course-order.ts`、出貨單列印、後台教材管理）；顯示端一律以快照欄位（`bookName`/`version`/`studentName`）呈現，不依賴 enrollment 關聯，實際影響面小。
- [移除上限後可能誤申請過量] → UI 常駐顯示「學員申請統計」對照與送出前合計確認；訂單仍可於批價前取消重來。
- [版本覆寫後與學員選版不一致造成困惑] → 訂單清單一律顯示快照版本；學員統計明確標示「參考」。
- [管理者代辦時快照取講師資料需補查詢] → `applyMaterialOrder` 改查 `invite.createdBy` 完整 profile（原本查 session user 的欄位集合平移），一次 `Promise.all` 內完成，無額外 round-trip。
- [誤按「完成教材申請」導致漏發教材即開課] → 完成動作需確認視窗（顯示尚未申請的參考數量）；開課前可「重新開放申請」；操作記入課程 LOG 可追溯。

## Migration Plan

1. 本機：`make schema-update name=material_apply_editable`（①`MaterialShipmentItem.enrollmentId` 改 optional：`DROP NOT NULL` 放寬型變更；②`CourseInvite.materialFinalizedAt DateTime?` 新增 nullable 欄位：additive。兩者對既有資料皆相容，既有課程 `materialFinalizedAt = null` 行為不變）。
2. 正式（VPS3）：`make tunnel-vps3` → `make prisma-vps3-status` → `make prisma-vps3-deploy`。
3. Rollback：程式面直接回退版本即可（舊程式不會建立 `enrollmentId = null` 的資料，`materialFinalizedAt` 欄位留存無害）；schema 若要收緊回 NOT NULL，須先確認正式庫無加購項目（`enrollmentId IS NULL`）資料，否則會失敗。

## Open Questions

- 加購項目的「書本名字」是否開放自填？（設計預設：可自填、預設「額外加購」，出貨單照快照顯示）——實作時若 UI 過重可先固定預設值。
