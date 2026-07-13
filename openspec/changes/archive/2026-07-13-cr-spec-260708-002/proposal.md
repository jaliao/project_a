# 課程資訊頁手機版優化＋結業資訊可見性修正

## Why

課程詳情頁在手機上排版不佳：標題與標籤/按鈕擠在同列造成折行混亂、基本資訊順序不符閱讀動線、已核准學員以表列＋Email 呈現過寬。另外正式環境發現**權限問題**：學員身分（如 pa260250）可看到課程 31 的結業資訊——現行規格與程式採 `canTeachAny`（持任一講師身分即可看**任何**課程的結業資訊），過寬，應收斂為該課程授課老師或管理者。

## What Changes

- **頁首手機優化**：課程標題不折行（獨立成行完整顯示），課程標籤（等級/狀態）與操作按鈕（編輯/分享）排列針對手機重排。
- 「編輯課程資訊」按鈕改為「**編輯**」，前面加 icon（純顯示文字變更，功能不變）。
- 「基本資訊」區塊標題改為「**課程基本資訊**」，欄位順序調整為：**授課老師 → 報名人數 → 預計開課日期 → 報名截止日期 → 開始上課日期 → 課程結業日期**（「結業日期」label 同步改「課程結業日期」）。
- **已核准學員**改為卡片式排版：**移除 Email**，重新編排（姓名＋教材選擇＋加入日期）。
- **修正結業資訊可見性**：由 `canTeachAny`（任一講師身分）改為**該課程授課老師（建立者）或管理者**（`isInstructor || isAdmin`）；其他講師、學員、一般會員一律不顯示。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-session-detail`: 基本資訊區塊（標題改名、欄位順序、結業日期 label）、頁首排版（標題/標籤/按鈕手機優化）、已核准學員清單（卡片式、移除 Email）。
- `course-graduation-info`: 結業資訊可見性由「任一講師身分或管理者（canTeachAny）」收斂為「**該課程授課老師或管理者**」。

## Impact

- **程式碼**：`app/[locale]/(user)/course/[id]/page.tsx`（頁首排版、canViewGraduation 判定、基本資訊區、學員清單卡片化、編輯按鈕文字＋icon 傳遞）、`components/course-session/edit-course-info-dialog.tsx`（trigger 按鈕文字＋icon）、`messages/*`（區塊標題/label 調整）。
- **資料**：無 schema/migration；`approvedEnrollments` 免查 email（select 可留用，顯示層拿掉）。
- **文件**：學員手冊「結業資訊僅管理者與講師可查閱」敘述更精確化（該課程講師）；老師手冊課程詳情章節同步；version.json patch +1。
- **相依**：`course-session-detail` 的「基本資訊區塊」requirement 在未歸檔變更 `cr-spec-260703-001` 已有 delta——**歸檔順序須 260703-001 在前**，本變更的 MODIFIED 以其修改後內容為基底。
