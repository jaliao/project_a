# Tasks: cr-spec-260720-004 已完成申請（教材）按鈕優化

## 1. Server Action

- [x] 1.1 `finalizeMaterialOrders`：課程存在 `receivedAt == null` 訂單時拒絕（訊息提示先完成收件）

## 2. UI（`course-detail-actions.tsx`）

- [x] 2.1 「已完成申請」按鈕停用條件：`orders.some(o => o.receivedAt == null)` 時 disabled
- [x] 2.2 完成狀態列（✓ 教材申請已完成＋「重新開放申請」）自單元②移至單元③申請作業（按鈕列位置）；「已完成申請」按鈕於完成時隱藏
- [x] 2.3 申請注意事項改 `<ul>/<li>` 清單、移除外框；新增條目「有進行中的教材訂單時無法按已完成申請」；（總需求 0 時）`noDemandHint` 併入清單

## 3. i18n 與文件

- [x] 3.1 `course.material.*` 新增 `noteFinalizeBlocked`（zh-TW＋en，zh-CN 重新產生）
- [x] 3.2 手冊（老師／管理者）補停用規則與狀態列位置；`config/version.json` patch +1；README-AI 同步

## 4. 驗證

- [x] 4.1 `npm run build` 與 `npm run lint` 通過
- [x] 4.2 手動驗證：有未收件訂單→按鈕灰色＋注意事項顯示原因；全收件→可按；完成後狀態列在申請作業單元；重新開放恢復
