# Tasks: cr-spec-260720-003 教材申請作業 UI 優化（三單元化）

## 1. UI 重構（`course-detail-actions.tsx`）

- [x] 1.1 教材申請作業區塊分三單元（小標）：①學員教材需求統計（總需求＋參考註記）②教材申請進度（已申請/尚未申請＋完成狀態列＋訂單清單＋空狀態）③申請作業
- [x] 1.2 申請作業單元：申請注意事項＋功能按鈕說明（申請教材／已完成申請各一句用途說明）；按鈕並列「申請教材」｜「已完成申請」；移除上一輪「無須額外申請」引導文字排版
- [x] 1.3 已完成申請狀態行為：狀態列（＋重新開放申請）移至單元②；「申請教材」停用＋提示、「已完成申請」隱藏；確認視窗標題同步更名

## 2. i18n

- [x] 2.1 `course.material.*`：新增 `sectionDemand`/`sectionProgress`/`sectionApply`/`applyNotesTitle`/`noteApplyButton`/`noteFinalizeButton`；`finalizeButton` 改「已完成申請」、`finalizeConfirmTitle` 同步；移除 `finalizeLeadIn`（zh-TW＋en，zh-CN 重新產生）

## 3. 文件與版本

- [x] 3.1 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：按鈕名稱改「已完成申請」、區塊描述改三單元結構；更新檔首版本
- [x] 3.2 `config/version.json` patch +1（updatedAt 同步）；README-AI.md 版本與描述同步

## 4. 驗證

- [x] 4.1 `npm run build` 與 `npm run lint` 通過
- [x] 4.2 手動驗證：三單元呈現、按鈕說明、已完成申請→狀態列移至進度單元且申請停用、重新開放後恢復
