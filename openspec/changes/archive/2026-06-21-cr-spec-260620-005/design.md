## Context

教材申請（申請書本）支援單一地址與多地址兩種寄送模式：
- 單一地址：寄件資訊存於 `CourseOrder` 自身欄位（`deliveryMethod`/`deliveryAddress`/`storeId`/`storeName`）。
- 多地址：每個地址存為一筆 `MaterialShipment` 批次。

兩者都缺少「收件人」與「連絡電話」。多地址批次完全沒有此資訊；單一地址僅有購買人 `phone`（語意非收件人）。出貨單列印頁目前顯示「收件者姓名」（取自購買人）但無連絡電話，且多地址各批次無對應收件人。物流因此無法得知每個地址的實際收件人／聯絡方式。

申請者為該課程講師（`CourseInvite.createdById` = 送單的登入使用者）。

## Goals / Non-Goals

**Goals:**
- 多地址每個地址必填「收件人」「連絡電話」。
- 單一地址新增「收件人」「連絡電話」，預設帶入申請講師（姓名 + `User.phone`），可修改。
- 出貨單列印頁顯示收件人與連絡電話（單一取自訂單、多地址取自各批次）。

**Non-Goals:**
- 不改動本數分配、寄送批次完成判定等既有邏輯。
- 不改動購買人（buyer）相關欄位語意。
- 不新增收件人電話格式驗證（沿用一般非空字串驗證，與既有 phone 欄位一致）。

## Decisions

### 決策 1：在 `CourseOrder` 與 `MaterialShipment` 各新增 `recipientName`、`recipientPhone`
單一地址用 `CourseOrder.recipientName`/`recipientPhone`；多地址每批次用 `MaterialShipment.recipientName`/`recipientPhone`。兩欄皆 `String?`（nullable），以相容既有資料列（沿用 `deliveryAddress` 同樣 nullable 的慣例）。
- 替代方案：單一地址重用 `teacherName`/`phone` 不加欄位 → 語意混淆（購買人 ≠ 收件人）且無法獨立修改，否決。

### 決策 2：單一地址預設值來源 = 申請講師
表單載入時，單一地址的收件人預設帶入登入講師的姓名（`User.realName`，fallback `User.name`），連絡電話預設帶入 `User.phone`。Server 端 `applyMaterialOrder` 在 `shipMode == single` 且欄位為空時，以同樣來源回填，確保不為空。
- 連絡電話來源採「講師個人資料電話（User.phone）」（依使用者決定），與收件人姓名來源一致。

### 決策 3：驗證策略
- 多地址：Zod 對寄送批次陣列每筆要求 `recipientName`、`recipientPhone` 非空，否則拒絕送出（與既有「門市必填」「本數分配」驗證並列）。
- 單一地址：欄位預設已帶入講師，視為必填非空（空字串時 server 以講師資料回填）。

### 決策 4：出貨單顯示與 fallback
列印頁每份出貨單新增「收件人」「連絡電話」兩列：單一地址取自 `CourseOrder`，多地址取自該 `MaterialShipment`。值為 null／空白時顯示「（未填）」，沿用既有 fallback 慣例。

## Risks / Trade-offs

- [既有資料列無收件人／電話（migration 前建立）] → 欄位 nullable，列印 fallback「（未填）」；不強制回填歷史資料。
- [收件人電話與購買人電話可能重複輸入] → 單一地址預設帶入講師電話降低重複輸入成本；兩者語意不同故保留分離。
- [User.phone 可能為空（講師未填個資）] → 預設帶入空字串，講師於表單手動補；不阻擋（出貨單顯示未填）。

## Migration Plan

`prisma/schema/course-order.prisma` 於 `CourseOrder` 與 `MaterialShipment` 各加兩個 nullable 欄位 → `make schema-update` 產生 migration。新增欄位 nullable，無破壞性、無需資料回填。回滾＝還原 schema 並 drop 欄位。

## Open Questions

無。
