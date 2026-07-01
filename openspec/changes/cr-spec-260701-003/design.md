## Context

- 學員申購：`applyToCourse(inviteId, materialChoice)` 設 `InviteEnrollment.materialChoice`（none/traditional/simplified）；`enrollment-application-dialog` 選版本。無「書本名字」。
- 教材需求彙總：`getEnrollmentMaterialSummary` 由報名 `materialChoice` 統計繁/簡**數量**。
- 老師訂購：`course-order-form` 建 `CourseOrder`（含 `traditionalQty/simplifiedQty`、`shipMode`、單一地址欄位、`studentNames` 自由文字），多地址以 `MaterialShipment`（每址 `traditionalQty/simplifiedQty` **數量** + 收件人 + 門市/宅配）。目前為**數量制**、學員身分為自由文字。
- 管理者後台 `material-order-table` 多地址列顯示：門市 + 繁/簡數量（＋004 後含收件人/備註）。

## Goals / Non-Goals

**Goals:**
- 學員申購填「書本名字」（預設 中文→英文→匿名，可編輯）。
- 教材以「逐本項目（學員書本名字＋版本）」表示；老師/管理者以**先建地址、再指派書本**流程分配到各寄送地址。
- 老師/管理者/列印呈現各地址的「學員名＋版本」。

**Non-Goals:**
- 不改金流（批價/收款）與寄送狀態機。
- 不改老師自用/代購（`purchaseType`）語意；`CourseOrder.materialVersion`（含 both）維持既有。
- 不做 i18n 新翻譯（沿用既有繁體/既有 key）。

## Decisions

1. **書本名字**：`InviteEnrollment.materialBookName String?`。`applyToCourse(inviteId, materialChoice, bookName?)`：`bookName` trim 後為空時採預設 `realName || englishName || '匿名'`；`materialChoice==='none'` 時不需名字。`enrollment-application-dialog` 加輸入欄，前端預帶預設。
2. **書本項目來源（逐本）**：某課程「已核准且 `materialChoice≠none`」的報名即書本項目：`{ enrollmentId, studentDisplayName, bookName, version }`（`version`＝該報名 `materialChoice`）。由 `lib/data` 提供清單。
3. **項目↔地址關聯**：新增 `MaterialShipmentItem { id, shipmentId(FK→MaterialShipment, cascade), enrollmentId(FK→InviteEnrollment), bookName(String 快照), version(String 快照 traditional/simplified), createdAt }`；`MaterialShipment.items[]`、`InviteEnrollment` 反向關聯。**指派時快照** `bookName/version`（學員事後改名不影響已建訂單）。migration `add_material_shipment_items` + `materialBookName`。
4. **地址優先流程（多地址 `shipMode=multiple`）**：`course-order-form` 多地址改為：①**先新增寄送地址**（收件人＋門市/宅配，一次）；②列出**未指派書本項目**（學員名＋書本名字＋版本）；③勾選指派至該地址（建立 `MaterialShipmentItem`）。每地址 `traditionalQty/simplifiedQty` **由已指派項目計數推導**寫入（相容既有列印/顯示/金流數量）。
5. **單一地址（`shipMode=single`）**：全部書本項目視為送至該（訂單本身）地址；不強制建立 shipment/item，顯示端直接由課程報名列出項目；`traditionalQty/simplifiedQty` 沿用彙總。
6. **無舊資料（系統未上線）**：不需相容既有訂單、不需回填。**書本項目（items）為單一真相**；`traditionalQty/simplifiedQty` 一律由項目計數**推導寫入**（供列印/金流數量），不再走「舊訂單沿用數量」的分支。
7. **指派完整性**：多地址送出時，所有書本項目 SHALL 皆被指派且僅指派一個地址；未指派/重複 → 阻擋並提示。
8. **顯示（老師詳情／管理者 `material-order-table`／列印頁）**：各地址呈現指派項目清單「學員名（書本名字）＋版本」；單一地址呈現全部項目。
9. **資料層**：`lib/data/course-order.ts` 型別擴充 `MaterialShipment.items`；`lib/data/course-sessions.ts` 或新 `lib/data/material-items.ts` 提供某課程書本項目清單（含 bookName 預設推導）。

## Risks / Trade-offs

- **course-order-form 多地址 UI 大改**（數量拆分 → 項目指派）：為本批主要工作量；單一地址流程盡量不動。
- **單一/多地址模型不對稱**（多地址有 item rows、單一無）：顯示端需分支；以「數量欄位為真相、item 為明細」降低風險。
- **無舊資料**：系統未上線，無需相容既有訂單/回填；items 為單一真相、qty 由項目推導，模型更單純。
- **快照 vs 連動**：bookName/version 於指派快照，避免學員改名/改版本影響已建訂單；學員未下單前顯示以即時 `materialBookName`。
- **一報名一本**：學員 `materialChoice` 單選（none/繁/簡），故一報名對一本；老師自用/代購（`purchaseType`、`CourseOrder.materialVersion=both`）與逐本學員項目為不同層次，維持並存。
- migration 為新增欄＋新表，非破壞性。
