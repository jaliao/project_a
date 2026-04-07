## Why

課程詳情頁目前有三個 UX 問題：結業按鈕在課程尚未開始時即出現（應只在進行中才顯示）、分享連結按鈕位置不明顯、課程進行中時缺少狀態標籤讓使用者確認課程狀態。

## What Changes

- **結業按鈕條件限制**：結業按鈕僅在課程已開始（`isStarted = true`）且未取消/未結業時顯示；課程尚未開始（招生中）時不顯示結業按鈕
- **分享按鈕移至右上角**：講師的「複製邀請連結」按鈕從頁面下方獨立區塊改為放置於頁首標題列右側（與已取消/已結業狀態標籤同排）
- **課程進度標籤補全**：頁首狀態標籤區補充「招生中」與「進行中」兩個狀態，讓所有課程狀態都有對應標籤顯示

## Capabilities

### New Capabilities
（無新增功能模組）

### Modified Capabilities
- `course-session-detail`：頁面佈局調整（分享按鈕移至右上、進度標籤補全）及結業按鈕顯示條件變更

## Impact

- `app/(user)/course/[id]/page.tsx`：標題列新增分享按鈕、補充進度標籤
- `app/(user)/course/[id]/course-detail-actions.tsx`：結業按鈕加入 `isStarted` 判斷條件
- `app/(user)/course/[id]/copy-invite-link-button.tsx`：按鈕樣式可能需調整（從 block 改為 icon/compact 以適應右上角配置）
