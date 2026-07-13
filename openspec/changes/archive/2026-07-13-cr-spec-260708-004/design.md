# 手機排版優化（學員頁卡片＋學習紀錄＋課程頁頁首）— 技術設計

## Context

- `CourseSessionCard`：標題 `<p>` 與標籤群（公開招生/等級/狀態，`size="sm"`）同列 `flex justify-between`，窄螢幕標題被擠壓折行。使用處：個人頁、我的授課、match-board。
- `LearningRecordsPanel`（`components/learning/feedback-entry.tsx`）：學習紀錄與「我的回饋狀態」皆為 `<table>`（`w-full text-sm`＋`divide-y`），窄螢幕欄位擠壓。
- 課程頁頁首（260708-002 後）：第一行標題、第二行標籤（`size="sm"`）＋按鈕（`size="sm"` h-8）。使用者回饋：標籤/按鈕應在標題**上方**，且標籤與按鈕大小同級（現行 sm badge＝`px-2 py-0.5 text-xs`，明顯小於按鈕）。
- Badge 元件既有 `size` variants：`sm`（px-2 py-0.5 text-xs）／`md`（px-3 py-1 text-sm，CourseStatusBadge；CourseCatalogBadge md 為 px-2.5 text-xs）。

## Goals / Non-Goals

**Goals:**
- 卡片與課程頁標題皆獨占一行不被擠壓；標籤列一律移標題上方。
- 學習紀錄兩個表格改卡片式。
- 課程頁頁首標籤與功能按鈕視覺同級。

**Non-Goals:**
- 不改任何資料流、i18n key、功能行為。
- 卡片內標籤維持 `sm`（卡片空間小，僅課程頁頁首升級標籤大小）。
- 不動 dashboard/match-board 等使用處的呼叫介面（props 不變）。

## Decisions

1. **`CourseSessionCard` 標題區改垂直堆疊**
   標籤列（公開招生/等級/狀態，維持 `size="sm"`）在上、標題 `<p>` 在下獨占整行（自然換行、不 truncate）。純內部 JSX 調整，props 介面不變，三個使用處自動受益。

2. **學習紀錄卡片化（兩個 table）**
   - 結業狀態表 → `space-y-2` 卡片列：每卡 `rounded-lg border p-3`——第一行課程名稱（`text-sm font-medium`）＋狀態徽章右對齊；第二行老師名（`text-xs text-muted-foreground`）；未結業列的「這有誤？回報」入口移卡片右下（維持既有行為與預帶）。
   - 「我的回饋狀態」表 → 同樣式卡片（類別/課程/狀態/管理者備註）。
   - 表頭移除（卡片自描述）；既有空狀態與 i18n key 全部沿用。

3. **課程頁頁首：標籤在上、標題在下；按鈕移入基本資訊卡片**
   頁首兩列：第一列標籤（維持 `size="sm"` 原本大小）、第二列標題 `<h1>` 獨占整行。「編輯」「複製邀請連結」按鈕自頁首移至**課程基本資訊卡片內底部一列**（編輯屬課程資訊的操作，語意歸位；頁首更乾淨）。CourseCatalogBadge md variant 不調整（曾試過 md 同按鈕大小，使用者定案恢復原大小）。

4. **操作按鈕樣式一致**
   「結業」兩處按鈕（`asChild Link` 與無學員 toast 版）移除 `variant="outline"` 改預設主色，與「開始上課」同級主要動作；FAQ 送出提問／送出回覆移除 `size="sm"` 用預設尺寸。刪除/取消類維持 destructive/outline 不動（語意區分保留）。

5. **260708-002 spec 疊加**
   「頁首手機版排版」requirement 以 002 的 delta 文本為基底 MODIFIED；歸檔順序 002 → 004。

## Risks / Trade-offs

- **[CourseCatalogBadge md variant 調大影響其他使用處]** → 全站 badge 尺寸一致化本就是目標方向；使用處少（grep 確認後走查）。
- **[卡片化後學習紀錄縱向變長]** → 手機可讀性優先；桌機每卡資訊密度仍低、可接受。

## Migration Plan

無 migration；部署即生效。回滾為還原程式碼。

## Open Questions

（無）
