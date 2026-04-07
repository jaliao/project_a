## 1. 結業按鈕條件限制

- [x] 1.1 在 `app/(user)/course/[id]/course-detail-actions.tsx` 的結業按鈕渲染區塊外層加入 `isStarted &&` 條件，使結業按鈕（含「尚無已核准學員」錯誤按鈕）僅在課程進行中時顯示

## 2. 分享按鈕移至頁首右上

- [x] 2.1 在 `app/(user)/course/[id]/page.tsx` 頁首右側 flex 容器（`<div className="flex shrink-0 gap-2">`）中，將 `<CopyInviteLinkButton>` 移入此容器，置於狀態標籤之前
- [x] 2.2 移除原本獨立渲染 `<CopyInviteLinkButton>` 的區塊（目前在學員清單上方）
- [x] 2.3 在 `app/(user)/course/[id]/copy-invite-link-button.tsx` 將按鈕加上 `size="sm"` 以符合右上角配置的視覺比例

## 3. 課程進度標籤補全

- [x] 3.1 在 `page.tsx` 頁首右側 flex 容器中，於現有「已取消」和「已結業」標籤之外，補充「進行中」標籤：條件為 `isStarted && !isCancelled && !isCompleted`，樣式為藍色（`bg-blue-100 text-blue-700`）
- [x] 3.2 補充「招生中」標籤：條件為 `!isStarted && !isCancelled && !isCompleted`，樣式為灰色（`bg-gray-100 text-gray-600`）

## 4. 共用元件抽取

- [x] 4.1 建立 `components/course-session/course-status-badge.tsx`（`CourseStatusBadge` + `getCourseStatus`），取代 `page.tsx` 與 `course-session-card.tsx` 的重複實作
- [x] 4.2 建立 `components/course-session/course-catalog-badge.tsx`（`CourseCatalogBadge` + `getCatalogColor`），取代 `course-session-card.tsx` 的 `CATALOG_COLORS`/`getCatalogColor` 內聯實作
- [x] 4.3 `page.tsx` 與 `course-session-card.tsx` 改用上述共用元件，統一標籤大小（`size="sm"`）
- [x] 4.4 `page.tsx` 移除 `max-w-3xl`，改為滿版顯示

## 5. 驗證

- [x] 5.1 執行 `npm run build` 確認無 TypeScript 編譯錯誤
