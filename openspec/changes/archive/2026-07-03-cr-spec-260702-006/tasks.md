# Tasks — 個人首頁整合學習進度與結業證明（cr-spec-260702-006）

## 1. 進度三卡元件

- [x] 1.1 新增 `components/learning/course-progress-cards.tsx`（server component）：props 收課程目錄清單與 certificates（每目錄最新結業，含 graduatedAt/班名/老師名）；依目錄順序固定渲染三卡——已結業＝完成樣式＋學業完成時間（YYYY/MM/DD）＋班名/老師小字，未結業＝虛線/灰階未完成樣式；`grid-cols-1 sm:grid-cols-3` 手機直排（繁體固定文案、標頭註解）

## 2. 個人首頁改造

- [x] 2.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：基本資料區塊內（身分標籤後）加入 `<CourseProgressCards>`（`getAllCourses()` × 既有 certificates 合成，所有訪客可見）
- [x] 2.2 同頁移除「結業證明」區塊與他人視角「學習紀錄預覽」區塊（本人「學習紀錄」面板保留）；清除未用 import（`CompletionCertificateCard`、`IconAward` 等）

## 3. 刪除 /learning 與孤兒清理

- [x] 3.1 刪除 `app/[locale]/(user)/learning/` 整個目錄
- [x] 3.2 刪除 `components/learning/level-progress.tsx` 與 `components/course-invite/completion-certificate-card.tsx`
- [x] 3.3 `messages/zh-TW.json`、`messages/en.json` 移除 `learning` 命名空間（zh-CN 於 build 由 OpenCC 重生，勿手改）
- [x] 3.4 `app/actions/learning-feedback.ts` 五處 `revalidatePath('/learning')` 改為使個人首頁學習紀錄面板更新的路徑（以操作者 spiritId 組實際路徑，或 revalidate 對應 layout；實測擇一）

## 4. 手冊與版本

- [x] 4.1 更新 `doc/學員手冊.md`：學習紀錄/結業證明章節改寫為「個人首頁基本資料三卡」；檢查 `doc/老師手冊.md` 是否提及 /learning 或結業證明區塊並同步；更新各檔檔首版本與日期
- [x] 4.2 `config/version.json` patch 版本 +1
- [x] 4.3 依 `.ai-rules.md` 更新 `README-AI.md`

## 5. 驗證

- [x] 5.1 `npm run lint` 與 `npm run build` 通過（build 亦驗證 zh-CN 重生與 /learning 移除無殘留引用）
- [ ] 5.2 手動驗證：本人/他人視角三卡固定顯示（目錄順序）、已結業卡顯示完成時間、未結業虛線樣式、他人看不到學習紀錄預覽與結業證明區塊、本人學習紀錄面板與回饋入口正常、送出回饋後面板資料更新、`/learning` 命中友善 404
