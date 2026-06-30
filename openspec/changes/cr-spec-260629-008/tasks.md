## 1. 訊息命名空間

- [x] 1.1 `messages/zh-TW.json` 新增 `course` 命名空間（sessions/material/detail/graduate；card/wizard/faq 待元件階段補）
- [x] 1.2 `messages/en.json` 補英文草稿
- [x] 1.3 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`

## 2. 課程頁

- [x] 2.1 `(user)/course/[id]/page.tsx`（詳情：基本資訊/結業資訊/已核准學員/教材標籤/狀態；ICU 計數；server `getTranslations`）
- [x] 2.2a `(user)/course/[id]/graduate/page.tsx`（結業頁標題/返回連結）
- [ ] 2.2b `graduate/graduation-form.tsx`（多步驟表單元件，~40 字串）→ 併入元件階段
- [x] 2.3 `(user)/course-sessions/page.tsx`（查詢頁）

## 3. course-session 元件

- [ ] 3.1 課程卡 `course-session-card`、`course-card-grid`
- [ ] 3.2 課程詳情子元件（報名/審核/操作等 client 元件）
- [ ] 3.3 開課精靈 `create-course-wizard/*`（靜態 UI；**驗證訊息維持原狀**，不動 course-session schema）
- [ ] 3.4 狀態選單等其餘 `course-session` 元件

## 4. faq / catalog 元件

- [ ] 4.1 `components/course-faq/*`
- [ ] 4.2 `components/course-catalog/*`（靜態 UI；目錄名為資料值不 key 化）

## 5. 版本與文件

- [ ] 5.1 `config/version.json` patch +1；README-AI 當前任務同步

## 6. 驗證

- [ ] 6.1 `npm run gen:zh-cn`、`npm run build`、`npm run lint` 通過
- [ ] 6.2 grep 課程目標檔殘留中文抽查（扣註解/內容/品牌；course-order/invite 不在本批）
- [ ] 6.3 確認與後台共用之 `course-*` schema 未被更動、後台未顯示原始 key
- [ ] 6.4 （執行階段，使用者）`/en`、`/zh-CN` 抽查課程瀏覽/詳情/結業頁
