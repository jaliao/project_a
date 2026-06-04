## Context

「啟動編號」是對現有 `spiritId` 欄位的統一 UI 命名。目前同一欄位在不同頁面以「靈人編號」、「Spirit ID」兩種名稱呈現，造成使用者混淆。此次為純 UI 文字更新 + 搜尋/排序邏輯微調，不影響 DB schema 或 API。

## Goals / Non-Goals

**Goals:**
- 統一 UI 顯示名稱為「啟動編號」
- 會員管理支援以啟動編號搜尋
- 會員管理列表排序：加入日期（新→舊）、姓名（A→Z）

**Non-Goals:**
- 不更動 DB 欄位名稱（`spiritId`）
- 不更動程式碼變數名稱
- 不更動 URL 路由

## Decisions

### D1：文字改名僅改 UI 層，程式碼變數不動
所有 `.tsx` 中的顯示文字從「靈人編號」/「Spirit ID」改為「啟動編號」，`spiritId` 變數與 DB 欄位保持不變。

### D2：搜尋以 `contains + insensitive` 加入 spiritId
在 `searchMembers` 的 OR 條件加入 `{ spiritId: { contains: q, mode: 'insensitive' } }`，與現有搜尋邏輯一致。

### D3：排序使用 `[createdAt desc, realName asc]`
主要排序：加入日期新→舊；次要排序：realName 字母序（null 放後）。
