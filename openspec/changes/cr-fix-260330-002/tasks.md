## 1. 修正授課資格判斷邏輯

- [x] 1.1 修改 `components/course-session/create-course-wizard/step-1-course-card.tsx` 第 42 行，將 `hasQualification` 改為 `isAdmin || graduatedCatalogIds.includes(course.id)`
- [x] 1.2 確認提示文字邏輯仍正確（無資格時顯示課程名稱，而非先修課程名稱）

## 2. 驗證

- [x] 2.1 以結業靈人 1 身分登入，確認靈人 1 課程卡片可點擊、靈人 2 卡片灰暗不可點擊
- [x] 2.2 以結業靈人 2 身分登入，確認靈人 2 課程卡片可點擊
- [x] 2.3 以 admin 身分登入，確認所有課程卡片均可點擊
- [x] 2.4 版本號 patch +1（config/version.json）
- [x] 2.5 更新 README-AI.md
