## Context

目前 `CourseOrder` 尚無資料模型與表單。Topbar 的「新增課程」按鈕已預留 onClick 佔位。本次建立完整的訂購流程：Dialog 入口 → 表單填寫 → Server Action 儲存至 DB。

表單設計參考使用者提供的 Google Form 欄位結構（13 欄），需支援條件顯示欄位（代購姓名、自填數量）。

## Goals / Non-Goals

**Goals:**
- 建立 `CourseOrder` Prisma 模型並 migration
- 實作訂購表單 Dialog（從 Topbar 觸發）
- 表單 Zod 驗證 + Server Action 儲存
- 條件欄位：代購姓名（選擇含代購時顯示）、自填數量（選「其他」時顯示）

**Non-Goals:**
- 訂單列表頁（管理後台 — 後續 CR）
- 訂單狀態流程（付款、出貨 — 後續 CR）
- Email 通知（後續 CR）
- 國外運費計算

## Decisions

### 1. Prisma schema：新增 `course-order.prisma` 獨立檔案
**選擇**：新增 `prisma/schema/course-order.prisma`，不修改 `user.prisma`。
**理由**：延續多檔案 schema 的 separation of concerns 策略，課程訂單屬於業務模型，與使用者認證模型分離。

### 2. 數量欄位：`quantity`（Int）+ `quantityNote`（String?）
**選擇**：`quantity` 存整數（1–8），若選「其他」則 `quantity = 0`，自填文字存入 `quantityNote`。
**理由**：統計時可直接用 `SUM(quantity)`，自填內容另存供人工處理。
**替代方案**：全用 String 儲存 — 放棄數字統計能力，不採用。

### 3. Dialog 狀態：由 Topbar 持有 `useState`
**選擇**：Topbar（已是 `"use client"`）持有 `isOpen` state，傳入 `<CourseOrderDialog open={isOpen} onOpenChange={setIsOpen} />`。
**理由**：不需全域 state（如 Zustand），Topbar 本身就是觸發點，就近管理最簡單。

### 4. 表單元件拆分：Dialog 殼 + Form 主體分離
**選擇**：
- `course-order-dialog.tsx` — Dialog wrapper，控制開關
- `course-order-form.tsx` — 表單主體，接收 `onSuccess` callback
**理由**：未來若需在非 Dialog 情境使用表單（如獨立頁面），可直接複用 Form。

### 5. CourseOrder 與 User 關聯：選填關聯
**選擇**：`submittedById String? @db.Uuid`，非必填。
**理由**：表單中購買人資訊已獨立填寫（非從 session 帶入），保持表單彈性；同時記錄提交者供稽核。

### 6. 開課日期：String 而非 Date
**選擇**：`courseDate String`（允許填「無」或日期文字）。
**理由**：原始需求明確要求「暫無開課計畫請填『無』」，使用 String 最直接，不需強制 Date 格式。

## Risks / Trade-offs

- **`quantity = 0` 代表自填** → 查詢時需過濾，JOIN `quantityNote` 才能得完整資訊；可接受，後台另處理
- **開課日期為 String** → 無法做日期範圍查詢；現階段僅需儲存，可接受
- **無 Email 通知** → 使用者提交後無確認信，後續 CR 補足

## Migration Plan

1. 新增 `prisma/schema/course-order.prisma`
2. 執行 `make schema-update name=add_course_order`
3. 部署前於 VPS3 執行 `make prisma-vps3-deploy`

## Open Questions

- 訂單提交後是否需要顯示訂單編號？（建議：顯示 `id` 供使用者截圖）
- 後續是否需要訂單管理後台？（預計下一個 CR）
