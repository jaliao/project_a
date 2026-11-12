## 1. 列表頁：查看詳情連結帶出篩選參數

- [x] 1.1 `app/[locale]/(admin)/admin/members/page.tsx`：比照既有 `exportParams` 的寫法，新增 `detailQs`（`q`／`gender`／`role`／`church` 有值時寫入，`page > 1` 時才寫入 `page`）
- [x] 1.2 「查看詳情」`<Link href={\`/admin/members/${member.id}\`}>` 改為帶上 `detailQs`

## 2. 詳情頁：返回連結文字與帶參數還原

- [x] 2.1 `app/[locale]/(admin)/admin/members/[id]/page.tsx`：`searchParams` 型別新增 `q`／`gender`／`role`／`church`／`page` 可選欄位
- [x] 2.2 依收到的 `searchParams` 組出 `backHref`（有值才寫入對應參數，皆無值時為 `/admin/members`）
- [x] 2.3 頁首連結文字由「← 返回清單」改為「← 返回會員管理」，`href` 改用 `backHref`

## 3. 驗證

- [ ] 3.1 於 `/admin/members` 輸入搜尋字串（或選篩選）並翻到第 2 頁，點「查看詳情」，確認網址帶有對應查詢參數 — **待使用者於可啟動 dev server 的環境人工確認**（本次 session 因環境問題無法啟動，見下）
- [ ] 3.2 於上一步的詳情頁點擊「← 返回會員管理」，確認導回 `/admin/members` 且搜尋字串/篩選/頁碼與離開前一致 — **待人工確認，理由同上**
- [ ] 3.3 直接以無查詢參數網址開啟任一會員詳情頁，確認返回連結導回無參數的 `/admin/members`（行為與現況一致） — **待人工確認，理由同上**
- [x] 3.4 `npm run lint` 與 `npm run build` 通過

> 3.1–3.3 無法於本次 session 完成：`npm run dev`（含不帶 `--turbopack` 的 `npx next dev`）在本機環境皆以 `TurbopackInternalError: Permission denied (os error 13)` 崩潰退出，重試與移除 sandbox 限制後仍相同，判斷為本機環境既有問題、與本次程式改動無關（`npm run build` 本身走獨立的建置流程，不受影響，已通過）。已改以程式碼逐行比對 `page.tsx`／`[id]/page.tsx` 的 query string 組裝與使用邏輯確認正確性，但未經實機瀏覽器操作驗證。

## 4. 文件同步

- [x] 4.1 依 CLAUDE.md 第 9 點，檢查 `doc/管理者操作手冊.md` 是否提及「返回清單」字樣，若有則同步改為「返回會員管理」
- [x] 4.2 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期；`README-AI.md` 索引版本號同步更新（若章節有變動）
- [x] 4.3 依 CLAUDE.md 第 8 點，視異動範圍更新 `ai-context/07-current-tasks.md`（「已完成」清單最前面附加本次 CR 紀錄）
