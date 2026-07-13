# Tasks — 廢除課程清單頁面 /course-sessions（cr-spec-260623-001）

## 1. 移除頁面與文案

- [x] 1.1 刪除 `app/[locale]/(user)/course-sessions/`（整個目錄，僅含 page.tsx）
- [x] 1.2 grep 確認 `course.sessions.*` 無他處引用後，自 `messages/zh-TW.json` 與 `messages/en.json` 移除 `course.sessions` 區塊（zh-CN 由 build 重產）
- [x] 1.3 全域 grep `/course-sessions`（排除 admin 與 lib/data）確認無殘留引用

## 2. 文件與版本

- [x] 2.1 `config/version.json` patch 版本號 +1（三份手冊未提及此頁，免改）
- [x] 2.2 依 `.ai-rules.md` 更新 `README-AI.md`（版本號＋本變更摘要；如路由清單列有 /course-sessions 一併移除）

## 3. 驗證

- [x] 3.1 `npm run lint` 與 `npm run build` 通過
- [x] 3.2 手動驗證：命中 `/course-sessions` 顯示友善 404；match-board、個人頁、我的授課（CourseSessionCard 使用處）正常
