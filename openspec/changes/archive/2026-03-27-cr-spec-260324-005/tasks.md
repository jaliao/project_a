## 1. 修改 Dashboard 頁面結構

- [x] 1.1 讀取現有 `app/(user)/dashboard/page.tsx` 了解當前結構
- [x] 1.2 移除舊有「快速連結」列與獨立「開課管理」區塊
- [x] 1.3 在統計卡片下方加入「學習」功能單元（加入學習 disabled 按鈕 + 學習紀錄連結至 `/learning`）
- [x] 1.4 加入「授課」功能單元（新增開課按鈕開啟 CourseSessionDialog + 開課查詢 disabled 按鈕）
- [x] 1.5 加入「管理者」功能單元（連結至 `/admin`），依 `session.user.role` 條件渲染（admin / superadmin 才顯示）

## 2. 版本與文件更新

- [x] 2.1 更新 `config/version.json` patch 版本號 +1
- [x] 2.2 更新 `README-AI.md`
