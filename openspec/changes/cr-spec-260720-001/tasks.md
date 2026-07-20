# Tasks: cr-spec-260720-001 教材申請內容可修改＋完成教材申請可開課

## 1. Schema 與 Migration

- [x] 1.1 `prisma/schema/course-order.prisma`：`MaterialShipmentItem.enrollmentId` 改為 `Int?`（relation 同步 optional）
- [x] 1.2 `prisma/schema/course-invite.prisma`：`CourseInvite` 新增 `materialFinalizedAt DateTime?` 欄位
- [x] 1.3 `make schema-update name=material_apply_editable` 建立 migration（放寬型＋additive，既有資料相容），確認 migration SQL 僅含 `DROP NOT NULL` 與 `ADD COLUMN`

## 2. Zod Schema 與資料層

- [x] 2.1 `lib/schemas/course-order.ts`：申請 payload 新增書本項目清單——單一地址 `items[]`、多地址 `shipments[].items[]`（項目型別：`{ kind: 'enrollment', enrollmentId, version }` | `{ kind: 'extra', version, bookName? }`），取代多地址現行 `enrollmentIds`；驗證訊息用 `validation.*` key
- [x] 2.2 `lib/data/material-items.ts`：確認 `getUnassignedBookItems` 在 `enrollmentId` nullable 後查詢語意不變（`where: { enrollment: { inviteId } }` 不會 match null），必要時補 `enrollmentId: { not: null }` 明確化
- [x] 2.3 巡檢 `MaterialShipmentItem` 讀取端（`lib/data/course-order.ts`、出貨單列印、後台教材管理）：顯示一律走快照欄位，修正任何依賴 `enrollment` 關聯非空的程式

## 3. Server Actions — 申請教材改版

- [x] 3.1 `applyMaterialOrder` 授權改為「課程講師或 `canAccessAdmin`」；購買人快照改取 `invite.createdBy` 完整 profile（原 session user 欄位集合平移），`submittedById` 記實際操作者
- [x] 3.2 `applyMaterialOrder` 移除「剩餘 < 1 拒絕」上限驗證，改為「本次項目合計 ≥ 1」；學員項目驗證：屬於當下 `getUnassignedBookItems` 範圍且不重複（保留防並發）；移除多地址「全數指派」檢查
- [x] 3.3 `applyMaterialOrder` 依送出項目（含版本覆寫與加購）推導訂單／批次 `traditionalQty`/`simplifiedQty`，寫入 `MaterialShipmentItem`（加購項目 `enrollmentId = null`、書名預設「額外加購」、學員名快照空字串）；不回寫學員 `materialChoice`
- [x] 3.4 講師端其餘教材 actions（`reportMaterialPayment`、`confirmReceipt`、`cancelCourseOrder`）授權同步擴為「講師或管理者」

## 4. Server Actions — 完成教材申請與開課門檻

- [x] 4.1 新增 `finalizeMaterialOrders(inviteId)` / `reopenMaterialOrders(inviteId)`：授權講師或管理者、限課程未開始／未取消／未結業；寫入／清空 `materialFinalizedAt`；記課程操作 LOG（含操作者）
- [x] 4.2 `lib/utils/course-start-gate.ts`：`evaluateCourseStartGate` 增加 `materialFinalized` 輸入，教材需求條件改為 `remaining = 0 || materialFinalized`（「訂單全收件」「已核准 ≥1」不變）
- [x] 4.3 `startCourseSession`（`app/actions/course-invite.ts`）與課程頁 gate 呼叫端傳入 `materialFinalizedAt` 判定；已標記完成時 `applyMaterialOrder` 拒絕新申請

## 5. UI — 申請對話框（`components/course-session/material-order-dialog.tsx`）

- [x] 5.1 單一地址模式：以逐本清單取代「自動帶入全部」說明——每列勾選框＋學員／書名＋版本下拉（繁/簡），預設全選、預設版本＝學員選版
- [x] 5.2 加購列：「＋新增一本」（版本必選、書名選填預設「額外加購」）；單一地址與多地址各地址皆可加購
- [x] 5.3 多地址模式：`BookAssignList` 每列增加版本下拉；移除「全數指派才可送出」限制（未指派＝本次不申請），保留不可重複指派
- [x] 5.4 合計對照列：「合計：繁 X、簡 Y（學員申請：繁 A、簡 B）」；空清單（0 本）時停用送出

## 6. UI — 課程頁教材申請作業區塊

- [x] 6.1 教材申請作業區塊可見／可操作條件由「講師本人」擴為「講師本人或管理者」（沿用班級管理前台化判定）
- [x] 6.2 「申請教材」按鈕：課程可操作且未標記完成即啟用（不再因尚未申請＝0 停用）；尚未申請＝0 時顯示「學員申請之教材已全數申請」參考提示；統計標示為參考值
- [x] 6.3 新增「完成教材申請」按鈕＋確認視窗（顯示尚未申請參考數量繁 X、簡 Y）；已完成時顯示完成狀態與「重新開放申請」；完成時「申請教材」停用並提示
- [x] 6.4 開始上課作業區塊：未達門檻原因顯示隨 gate 放寬同步（已完成時不再顯示「尚有教材未申請」）

## 7. i18n

- [x] 7.1 新增 UI 文案加入 `messages/zh-TW.json` 並補 `messages/en.json`（清單編輯、加購、完成教材申請、確認視窗、參考提示等）；不得在元件寫死中文；簡體由 `npm run gen:zh-cn` 產生

## 8. 手冊與版本

- [x] 8.1 `doc/老師手冊.md`：教材申請逐本編輯／加購、完成教材申請與開課條件變更；更新檔首版本與日期
- [x] 8.2 `doc/管理者操作手冊.md`：管理者於前台課程頁修改／申請／完成教材申請；更新檔首版本與日期
- [x] 8.3 `doc/學員手冊.md`：確認學員流程未變（選版仍於報名時），如需補充「選版為參考」說明則一併更新
- [x] 8.4 `config/version.json` patch +1、`updatedAt` 更新為套用當日；依 `.ai-rules.md` 重新產生 `README-AI.md`

## 9. 驗證

- [x] 9.1 `npm run lint` 與 `npm run build` 通過
- [ ] 9.2 手動驗證主要情境：①單一地址調版本／取消勾選／加購送出 ②多地址部分指派＋加購 ③管理者於他人課程頁申請 ④remaining > 0 時完成教材申請 → 開課按鈕啟用 ⑤已完成但訂單未收件 → 仍擋開課 ⑥重新開放後可再申請 ⑦並發重複申請被拒
