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

- [x] 3.1 課程卡 `course-session-card`（轉 client）、`course-card-grid`（無字串）、`course-login-prompt`、`enrolled-students-list`、`test-course-session-button`
- [x] 3.2 課程詳情子元件：對話框（cancel/edit-info/enrollment/session-dialog）+ co-located（student-apply/match-settings/instructor-feedback/pending-enrollment/copy-invite-link）
- [x] 3.3 開課精靈 `create-course-wizard/*`（5 檔靜態 UI；**驗證訊息維持原狀**，course-session schema 不動）；graduation-form 多步驟表單
- [x] 3.4 範圍調整：`material-order-dialog`（教材訂購）+ `course-detail-actions`（教材/付款耦合）→ 009；`course-status-select`（後台）排除；`course-session-form` 為 dead code 未動

## 4. faq / catalog 元件

- [x] 4.1 `components/course-faq/*`（提問/回覆/刪除）
- [x] 4.2 範圍調整：`components/course-catalog/*`（table/edit-dialog 為後台目錄 CRUD）→ 排除（維持繁體）；catalog-badge 之 label 為資料值不 key 化

## 5. 版本與文件

- [x] 5.1 `config/version.json` 0.1.104 → 0.1.105；README-AI 當前任務同步

## 6. 驗證

- [x] 6.1 `npm run gen:zh-cn`、`npm run build`（✓ Compiled）、`npm run lint`（0 errors）通過
- [x] 6.2 grep 課程 in-scope 目標檔無殘留硬寫中文（排除 course-detail-actions/material-order→009、後台、dead form、註解、內容）
- [x] 6.3 與後台共用之 `course-*` schema 未更動；後台未顯示原始 key
- [ ] 6.4 （執行階段，使用者）`/en`、`/zh-CN` 抽查課程瀏覽/詳情/結業/開課精靈
