# Tasks — 課程資訊頁手機版優化＋結業資訊可見性修正（cr-spec-260708-002）

## 1. 權限修正（最優先）

- [x] 1.1 `page.tsx` `canViewGraduation` 由 `canTeachAny(roles)` 改為 `isInstructor || isAdmin`；若 `canTeachAny` 此頁無他用一併移除 import

## 2. 頁首排版

- [x] 2.1 頁首改「標題獨立成行」結構：h1 獨占一行（自然換行、不 truncate）；下一列左側標籤（等級＋狀態）、右側操作按鈕（編輯＋複製連結），手機無水平捲動
- [x] 2.2 `edit-course-info-dialog.tsx` trigger 改為 IconEdit＋「編輯」（優先重用 `common.edit` key，無則新增；DialogTitle 維持「編輯課程資訊」）

## 3. 課程基本資訊區塊

- [x] 3.1 i18n：`course.detail.basicInfo` 值改「課程基本資訊」（en "Course info"）；`completedDate` 值改「課程結業日期」（en "Course completion date"）
- [x] 3.2 `page.tsx` 欄位 DOM 重排為：授課老師 → 報名人數 → 預計開課日期 → 報名截止日期 → 開始上課日期 → 課程結業日期

## 4. 已核准學員卡片化

- [x] 4.1 `page.tsx` 學員清單改 `grid grid-cols-1 sm:grid-cols-2 gap-3` 卡片（姓名／教材標籤＋加入日期），移除 Email 顯示；空狀態照舊

## 5. 文件與版本

- [x] 5.1 `doc/學員手冊.md` 結業資訊可見性敘述精確化（僅該課程授課老師與管理者）；`doc/老師手冊.md` 課程詳情章節同步（基本資訊改名/順序、學員卡片、編輯按鈕）；更新兩檔檔首版本日期
- [x] 5.2 `config/version.json` patch 版本號 +1
- [x] 5.3 依 `.ai-rules.md` 更新 `README-AI.md`

## 6. 驗證

- [x] 6.1 `npm run lint` 與 `npm run build` 通過
- [x] 6.2 手動驗證：①手機視窗頁首標題完整、標籤/按鈕排列正常無水平捲動；②基本資訊標題與六欄順序正確；③學員卡片無 Email；④以持講師身分的非授課老師帳號（如 pa260250）開啟課程 31——**看不到**結業資訊；授課老師與管理者看得到
