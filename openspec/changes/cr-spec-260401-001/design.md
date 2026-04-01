## Context

`cr-spec-260331-002` 將超商門市改用 `storeId` / `storeName` 欄位，但 `getCourseOrderForPrint` 的 Prisma select 未補上這兩個欄位，列印頁也沒有對應的條件渲染邏輯。

## Goals / Non-Goals

**Goals:**
- 出貨單列印頁正確顯示超商門市名稱與店號
- 郵寄訂單繼續顯示收件地址

**Non-Goals:**
- 不調整其他頁面（後台管理列表已在 cr-spec-260330-008 處理過）

## Decisions

變更極小，不需要新架構：

1. `getCourseOrderForPrint` select 補 `storeId`、`storeName`，同步更新 `CourseOrderForPrint` 型別
2. 列印頁收件資訊區塊：`isCVS`（sevenEleven / familyMart）時顯示門市名稱 + 店號兩列；`delivery` 時顯示收件地址一列
3. `getAddressLabel` 輔助函式不再需要，直接以條件渲染取代

## Risks / Trade-offs

無。純 UI 修正，不涉及 schema 或 action 變更。
