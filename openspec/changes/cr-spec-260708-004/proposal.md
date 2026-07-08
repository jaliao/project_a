# 手機排版優化（學員頁卡片＋學習紀錄＋課程頁頁首）

## Why

手機上仍有三處排版問題：學員頁課程卡片的標題與標籤同列互相擠壓造成折行；學習紀錄用 `<table>` 呈現在窄螢幕上難以閱讀；課程頁頁首的標籤/按鈕列在標題下方（260708-002 的排法），實際使用後希望改為標籤與功能按鈕在標題**上方**，且標籤大小與功能按鈕同級、視覺一致。

## What Changes

- **課程卡片（`CourseSessionCard`）**：課程標籤（等級/狀態/公開招生）移到課程標題**上方**一列；標題獨占一行不折行（不被標籤擠壓）。
- **學習紀錄（`LearningRecordsPanel`）**：`<table>` 改為**卡片式**列表（課程名稱／老師／狀態徽章／回報入口），同面板的「我的回饋狀態」表格一併卡片化。
- **課程頁頁首**：標籤移到課程標題**上方**（維持 `sm` 原本大小）；標題獨占一行；**功能按鈕（編輯/複製連結）移到課程基本資訊卡片下方**（卡片內底部一列），頁首不放按鈕。
- **操作按鈕樣式一致**：「結業」按鈕改為與「開始上課」相同的預設主色按鈕（現為 outline）；FAQ「送出提問／送出回覆」按鈕改與其他操作按鈕一致（預設尺寸，現為 `size="sm"`）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-session-card`: 卡片標籤列移至標題上方、標題獨立成行不折行。
- `course-session-detail`: 「頁首手機版排版」requirement 修改——標籤/按鈕列改於標題上方、標籤與按鈕同級大小（**基底為未歸檔 260708-002 的 delta，歸檔順序 002 → 本變更**）。
- `learning-record-feedback`: 本人課程結業狀態列表由表格改卡片式呈現。

## Impact

- **程式碼**：`components/course-session/course-session-card.tsx`、`components/learning/feedback-entry.tsx`（兩個 table）、`app/[locale]/(user)/course/[id]/page.tsx`（頁首列序與 badge size）。純樣式/排版，無邏輯與資料異動。
- **文件**：無流程變更，手冊免改；version.json patch +1＋updatedAt；README-AI。
- **不影響**：卡片與面板的資料來源、i18n key、match-board／個人頁／我的授課等 `CourseSessionCard` 使用處的功能行為（樣式同步受益）。
