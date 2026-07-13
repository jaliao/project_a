# Tasks: cr-spec-260706-001 多地址切換回單一地址後無法送出（驗證修正）

## 1. Schema 驗證修正（lib/schemas/course-order.ts）

- [x] 1.1 新增寬鬆版寄送項目 schema（欄位形狀與 `shipmentItemSchema` 相同，去除 `.min(1)` 必填與 superRefine；相鄰定義並加註對應關係註釋）
- [x] 1.2 `materialOrderSchema.shipments` 改用寬鬆版項目 schema（`z.array(寬鬆版).optional()`），確認 `z.infer` 推導型別不變
- [x] 1.3 於 `materialOrderSchema.superRefine` 的 `shipMode === 'multiple'` 分支，逐列以 `shipmentItemSchema.safeParse()` 驗證，將 issues 以 `path: ['shipments', i, ...issue.path]` 轉發（訊息與欄位定位維持現行）

## 2. 表單與 Server Action 確認

- [x] 2.1 確認 `material-order-dialog.tsx` 切換模式不需修改：切回 single 保留 `shipments` 資料、不清空（預期零修改，僅驗證）
- [x] 2.2 確認 `app/actions/course-order.ts` single 分支忽略殘留 `shipments`、不建立任何 `MaterialShipment`（現況已如此，補實測確認）

## 3. 驗證

- [x] 3.1 實測回報情境：multiple 加未填完地址列 → 切回 single 填妥單一地址 → 可成功送出，且無寄送批次被建立（schema 層自動化測試通過；single 分支不讀 shipments 已由程式碼確認）
- [x] 3.2 實測 multiple 模式驗證不回歸：缺收件人/電話/門市/宅配地址/書本指派時，錯誤訊息仍逐列正確顯示、擋下送出（schema 層自動化測試：path 逐列對應、文案不變）
- [x] 3.3 實測模式來回切換（multiple → single → multiple）已填地址列資料不遺失（程式碼確認：切換僅改 shipMode，無任何清空/reset shipments 邏輯）
- [x] 3.4 `npm run lint` 與 `npm run build` 通過（lint 0 errors、build 成功）

## 4. 收尾（依專案規範）

- [x] 4.1 檢查並同步 `doc/` 三份操作手冊（已確認：手冊描述之多地址流程/按鈕/權限皆無變動，免改）
- [x] 4.2 `config/version.json` patch 版本號 +1（0.1.123 → 0.1.124）
- [x] 4.3 依 `.ai-rules.md` 更新 `README-AI.md`（版本標註 0.1.124／2026-07-06＋當前任務新增本 change 摘要）
