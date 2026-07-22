## 1. Schema 與 Migration

- [x] 1.1 `prisma/schema/course-invite.prisma`：`MaterialChoice` enum 新增 `english`（保留 `none`/`traditional`/`simplified` 原順序，新增值加在最後）
- [x] 1.2 `prisma/schema/course-order.prisma`：`CourseOrder` 新增 `englishQty Int @default(0)`（緊接 `simplifiedQty` 之後）
- [x] 1.3 `prisma/schema/course-order.prisma`：`MaterialShipment` 新增 `englishQty Int @default(0)`（緊接 `simplifiedQty` 之後）
- [x] 1.4 `make schema-update name=add_english_material_choice` 產生並套用本地開發庫 migration
- [x] 1.5 `make prisma-status` 確認 migration 狀態正常

## 2. Zod Schemas

- [x] 2.1 `lib/schemas/course-order.ts`：`orderBookItemInputSchema` 兩個分支的 `version` enum 由 `['traditional', 'simplified']` 改為 `['traditional', 'simplified', 'english']`（`courseOrderSchema.materialVersion` 為不掛載的舊表單，不動）

## 3. Data 層與共用 Utils

- [x] 3.1 `lib/data/material-items.ts`：`BookVersion` type 由 `'traditional' | 'simplified'` 改為 `'traditional' | 'simplified' | 'english'`
- [x] 3.2 `lib/utils/material-progress.ts`：`MaterialCount` type 新增 `english: number`；`computeMaterialProgress` 的 reduce 初始值、加總、`remaining` 計算、`canApplyMore` 判斷式一併納入 `english`／`englishQty`
- [x] 3.3 `lib/data/course-sessions.ts`：`getEnrollmentMaterialSummary` 回傳型別與計數邏輯新增 `english`（統計 `materialChoice === 'english'`）
- [x] 3.4 `lib/data/course-sessions.ts`：其餘出現 `traditionalQty`/`simplifiedQty` 的 select/回傳型別（約 L208、L288-300、L338、L375-388）比照新增 `englishQty`
- [x] 3.5 `lib/data/course-order.ts`：所有 `traditionalQty`/`simplifiedQty` 型別、select、回傳物件（約 L41-116、L159-207、L251-290）比照新增 `englishQty`
- [x] 3.6 `lib/utils/course-start-gate.ts`：`remaining` 型別新增 `english`，未完成教材判斷式（`traditional + simplified > 0`）與提示文字（`尚有教材未申請（繁 X、簡 Y）`）一併納入英文本數

## 4. Server Actions

- [x] 4.1 `app/actions/course-invite.ts`：`applyToCourse` 的 `materialChoice` 參數型別由 `'none' | 'traditional' | 'simplified'` 改為 `'none' | 'traditional' | 'simplified' | 'english'`
- [x] 4.2 `app/actions/course-invite.ts`：`computeMaterialProgress` 呼叫處（約 L360-377）確認 `orders` select 已含 `englishQty`（依 3.5 調整後應自動相容，逐一確認型別無誤）
- [x] 4.3 `app/actions/course-order.ts`：`applyMaterialOrder` 中依書本項目版本推導 `traditionalQty`/`simplifiedQty` 的計數邏輯，新增 `englishQty` 分支（`createCourseOrder`／舊 `courseOrderSchema` 路徑不動，見 design.md）
- [x] 4.4 `app/actions/test-course-session.ts`：`MATERIAL_CHOICES` 陣列新增 `'english'`，供測試課程種子資料涵蓋三版本

## 5. UI — 學員申請書籍

- [x] 5.1 `components/course-session/enrollment-application-dialog.tsx`：`MaterialChoice` type 新增 `'english'`；選項陣列（約 L42-44）新增第四個選項（`course.material.english` / `course.enroll.engDesc`）
- [x] 5.2 `components/course-session/enrollment-application-dialog.tsx`：教材所屬姓名欄位顯示條件（約 L115，`selected === 'traditional' || selected === 'simplified'`）新增 `|| selected === 'english'`
- [x] 5.3 `app/[locale]/(user)/course/[id]/approved-students-section.tsx`：`MATERIAL_COLORS`（約 L23-24）新增 `english` 對應色系

## 6. UI — 老師/管理者教材申請對話框

- [x] 6.1 `components/course-session/material-order-dialog.tsx`：所有 `version: 'traditional' | 'simplified'` 型別標註（約 L105-106、L459-460、L465、L536、L755）改為含 `'english'` 的三選一聯合型別
- [x] 6.2 `components/course-session/material-order-dialog.tsx`：`VersionSelect` 元件（約 L454-471）新增第三個 `SelectItem`（`versionShortEnglish`）
- [x] 6.3 `components/course-session/material-order-dialog.tsx`：本數統計（約 L113-114 `trad`/`simp` 計數）新增 `eng` 計數；`totalLine`/`studentRefLine` 顯示（約 L433）改為同時帶入 `trad`/`simp`/`eng`
- [x] 6.4 `components/course-session/material-order-dialog.tsx`：加購項目預設 `version: 'traditional'`（約 L590、L822）維持預設繁體不變，僅需確認型別已放寬支援後續改選英文

## 7. UI — 課程詳情頁（教材需求統計／進度／訂單清單）

- [x] 7.1 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：`bookLabel(trad, simp)` 函式（約 L94）簽章新增 `eng` 參數並輸出「繁 X / 簡 Y / 英 Z」；更新所有呼叫處（約 L132、L152、L319、L331、L336、L354）補傳英文本數
- [x] 7.2 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：訂單書本清單版本文字（約 L139，`it.version === 'traditional' ? '繁' : '簡'`）改為三版本判斷（繁/簡/英）
- [x] 7.3 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：`total.traditional + total.simplified`（約 L434、L450）等合計判斷一併加上 `total.english`
- [x] 7.4 `app/[locale]/(user)/course/[id]/page.tsx`：確認 `getEnrollmentMaterialSummary`／`computeMaterialProgress` 呼叫串接後的資料（含 `remaining.english`）正確傳入子元件

## 8. UI — 後台教材管理與出貨單列印

- [x] 8.1 `components/admin/material-order-table.tsx`：本數顯示（約 L184、L228，`繁 {trad} / 簡 {simp}`）改為含英文本數
- [x] 8.2 `components/admin/material-order-table.tsx`：書本清單版本文字（約 L208、L266，`it.version === 'traditional' ? '繁' : '簡'`）改為三版本判斷
- [x] 8.3 `app/[locale]/(admin)/admin/materials/[id]/print/page.tsx`：`traditional`/`simplified` 統計物件（約 L44-65）新增 `english` 欄位
- [x] 8.4 `app/[locale]/(admin)/admin/materials/[id]/print/page.tsx`：書本清單版本文字（約 L155，`（{it.version === 'traditional' ? '繁' : '簡'}）`）改為三版本判斷
- [x] 8.5 `app/[locale]/(admin)/admin/materials/[id]/print/page.tsx`：出貨單本數顯示區塊（約 L169-173）新增英文本數列與總本數加總納入英文

## 9. i18n

- [x] 9.1 `messages/zh-TW.json`：`course.material` 命名空間新增 `english`（教材標籤）、`versionShortEnglish`（簡短版本標籤）
- [x] 9.2 `messages/zh-TW.json`：`course.enroll` 命名空間新增 `engDesc`（英文教材選項說明文字，比照 `tradDesc`/`simpDesc`）
- [x] 9.3 `messages/zh-TW.json`：`totalLine`／`studentRefLine` 等含 `{trad}`/`{simp}` 佔位符的文案，新增 `{eng}` 佔位符與對應顯示片段（含 `finalizeConfirmRemaining`）
- [x] 9.4 `messages/en.json`：同步補齊 9.1–9.3 新增的所有 key 的英文翻譯
- [x] 9.5 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 10. 操作手冊與版本號

- [x] 10.1 檢查並修正 `doc/老師手冊.md`：教材申請流程新增「英文教材」選項說明
- [x] 10.2 檢查並修正 `doc/學員手冊.md`：申請參加課程之「選擇書籍」新增「英文教材」選項說明
- [x] 10.3 檢查並修正 `doc/管理者操作手冊.md`：後台教材管理列表/詳情/出貨單顯示英文本數說明
- [x] 10.4 三份手冊檔首版本標註與日期同步更新
- [x] 10.5 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期

## 11. 驗證

- [x] 11.1 `npm run lint` 通過
- [x] 11.2 `npm run build` 通過
- [x] 11.3 手動測試：學員以「英文教材」申請 → 老師申請教材對話框預帶英文書本項目 → 送出後訂單 `englishQty` 正確
- [x] 11.4 手動測試：多地址模式下將書本項目指派英文版本至地址 → 該地址英文本數正確推導
- [x] 11.5 手動測試：後台教材管理列表/詳情、出貨單列印頁正確顯示繁/簡/英本數與書本清單
- [x] 11.6 手動測試：舊資料（既有 `none`/`traditional`/`simplified` 記錄與訂單）顯示與操作皆不受影響
