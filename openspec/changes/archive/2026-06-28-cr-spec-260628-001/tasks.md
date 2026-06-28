## 1. 資料層：viewer 過濾

- [x] 1.1 `lib/data/course-message.ts`：`getCourseMessages` 簽章新增 `viewer: { userId: string; isInstructor: boolean }` 參數
- [x] 1.2 依 viewer 組 `where`：老師為 `{ inviteId, parentId: null }`；非老師為 `{ inviteId, parentId: null, authorId: viewer.userId }`
- [x] 1.3 確認回覆（內嵌 `replies`）隨 top-level 串帶出不需另外過濾（老師回覆掛在發問者串下，發問者仍可見）

## 2. 呼叫端：傳入檢視者身分

- [x] 2.1 `app/(user)/course/[id]/page.tsx`：將既有 `currentUserId` / `isInstructor` 傳入 `getCourseMessages(courseSession.id, { userId, isInstructor })`
- [x] 2.2 確認全庫無其他 `getCourseMessages` 呼叫點遺漏（grep 驗證）

## 3. 元件文案（非必要微調）

- [x] 3.1 `components/course-faq/course-faq.tsx`：空狀態文案視情況調整為貼近「您目前尚無提問」（邏輯不變，可選）

## 4. 驗證

- [x] 4.1 `npm run build` 通過（TypeScript 必填參數無遺漏）
- [x] 4.2 手動驗證：發問者只見自己的串；他會員看不到此串；老師見全部
- [x] 4.3 手動驗證：一般會員自己無提問時顯示空狀態

## 5. 文件與版本（CLAUDE.md 第 7/9 點）

- [x] 5.1 同步 `doc/老師手冊.md`、`doc/學員手冊.md` FAQ 可見性說明，更新檔首版本與日期
- [x] 5.2 `config/version.json` patch 版本號 +1
- [x] 5.3 依 `.ai-rules.md` 重新產生 `README-AI.md`
