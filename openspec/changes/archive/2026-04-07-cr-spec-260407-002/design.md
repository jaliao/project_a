## Context

課程詳情頁（`/course/[id]`）由一個 Server Component（`page.tsx`）搭配數個 Client Component 組成。目前三個問題均為純 UI 調整，不涉及資料模型或 Server Action 變更：

- 結業按鈕：`CourseDetailActions` 元件已有 `isStarted` prop，但未將其作為結業按鈕的顯示條件
- 分享按鈕：`CopyInviteLinkButton` 獨立渲染於學員清單上方，未整合進頁首 flex 列
- 進度標籤：頁首 `div` 只有「已取消」和「已結業」兩個狀態標籤，缺少「招生中」和「進行中」

## Goals / Non-Goals

**Goals:**
- 結業按鈕僅在 `isStarted && !isCancelled && !isCompleted` 時顯示
- 複製邀請連結按鈕移入頁首右側 flex 容器，與狀態標籤同排
- 頁首補充「招生中」（`!isStarted`）與「進行中」（`isStarted`）標籤

**Non-Goals:**
- 不變更資料模型、Server Action 或 API
- 不改變結業流程邏輯（`/course/[id]/graduate` 頁面不動）
- 不調整學員端的顯示內容

## Decisions

**D1：結業按鈕條件加入 `isStarted`**

在 `CourseDetailActions` 的結業按鈕區塊加入 `isStarted` 判斷。
`isStarted` prop 已傳入，無需新增資料查詢。

```
// 修改前
{hasApprovedStudents ? ... : ...}  // 直接顯示

// 修改後
{isStarted && (hasApprovedStudents ? ... : ...)}
```

**D2：分享按鈕整合進頁首 flex 列**

`page.tsx` 頁首目前結構：
```
<div className="flex items-start justify-between gap-3">
  <div>  // 左：標題 + 等級標籤
  <div className="flex shrink-0 gap-2">  // 右：狀態標籤
```

將 `CopyInviteLinkButton` 移入右側 `div`，置於狀態標籤之前。
`CopyInviteLinkButton` 目前為 `variant="outline"` 按鈕，配合 `size="sm"` 以縮小佔位。

**D3：進度標籤直接寫在 `page.tsx`**

不另建元件，直接在右側 `div` 補充兩個 inline 標籤：
- `!isStarted && !isCancelled && !isCompleted` → 「招生中」（灰色）
- `isStarted && !isCancelled && !isCompleted` → 「進行中」（藍色）

## Risks / Trade-offs

- **RW1：頁首右側元素過多** → 右側 flex 最多可能同時出現：分享按鈕 + 一個狀態標籤，數量可控，不需要 overflow 處理
- **RW2：`CopyInviteLinkButton` 樣式** → 目前按鈕尺寸若與標籤不對齊，需調整 `size` 或 padding；低風險，視覺確認後修正即可
