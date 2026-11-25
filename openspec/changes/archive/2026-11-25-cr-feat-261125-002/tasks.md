## 1. 卡片欄位調整

- [x] 1.1 於 `app/[locale]/(admin)/admin/certificates/page.tsx` 新增「學員姓名」欄位列（置於「學員」列之後、「學員編號」列之前），內容為 `[it.realName, it.englishName].filter(Boolean).join(' ') || '—'`
- [x] 1.2 將「暱稱：」標籤文字改為「學員暱稱：」

## 2. 本機驗證

- [x] 2.1 `npm run build` 確認可正常編譯
- [x] 2.2 `npm run dev` 啟動後確認 `/admin/certificates` 路由正常編譯載入（未登入正確導向 `/login?callbackUrl=%2Fadmin%2Fcertificates`，無 500 錯誤）；因無可登入 admin 的瀏覽器 session，未能實際截圖驗證卡片視覺排版，僅以程式碼審閱確認欄位順序與既有 `realNameText` 變數使用正確——建議使用者實際登入後端看一次

## 3. 文件同步

- [x] 3.1 更新 `doc/管理者操作手冊.md` 的「證書製作」欄位說明段落，補上「學員姓名」欄位、「暱稱」改為「學員暱稱」
- [x] 3.2 更新 `doc/管理者操作手冊.md` 檔首版本標註與日期（比照 CLAUDE.md 第 9 條，含 patch +1）
- [x] 3.3 `老師手冊.md`／`學員手冊.md` 檢查後確認無相關內容（此頁僅 admin 可見；`老師手冊.md` 僅有結業提示彈窗的一般性提及，與欄位排版無關，未修改）
- [x] 3.4 更新 `config/version.json`（patch +1、`updatedAt` 當日）、`README-AI.md` 版本行、`ai-context/07-current-tasks.md` 新增本次 CR 記錄
