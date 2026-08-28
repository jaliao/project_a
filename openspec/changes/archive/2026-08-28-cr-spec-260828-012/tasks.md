## 1. 大綱設定檔（啟動豐盛 12 課）

- [x] 1.1 `config/learning-outline.ts`：`LEARNING_OUTLINE` 加入 `2: { courseCatalogId: 2, lessons: [...] }`，依 design.md「Decision 1」表格建置 `lesson-01` ~ `lesson-12`（`order` 1~12、標題「第 N 課：<標題>」、`lesson-01` `scriptures: []`、其餘各 3 個經文項目）
- [x] 1.2 `scriptureKey` 依 design.md 表格（`<書卷英文縮寫小寫>-<章數 2 位補零>`，同一 catalog 內唯一）；經文 `label` 採聖經和合本正式書名（「創世記」）
- [x] 1.3 檔首註解更新：「啟動豐盛（courseCatalogId = 2）已建置十二課；啟動得勝（3）待日後補上」
- [x] 1.4 執行時驗證：`LEARNING_OUTLINE[2]` 12 課、`getOutlineCatalogIds()` = `[1, 2]`、33 個經文項目全部 `isValidOutlinePath(2, …)` = true、33 個 `scriptureKey` 全唯一、`lesson-01` scriptures = 0

## 2. 驗證

- [x] 2.1 `npm run lint`：0 errors（16 個既有 warning，皆非本次）
- [x] 2.2 `npx tsc --noEmit` 0 errors；`npm run build`：`✓ Compiled successfully`、107/107 頁
- [~] 2.3 「啟動豐盛已解鎖」的完整畫面驗證（12 張課次卡、進度數、第一課「無需填寫」）**待人工實測**——dev DB 中在啟動豐盛已解鎖的帳號皆為名冊匯入帳號（無已知密碼），無法以 curl 走完整登入；結構面已由 1.4 保證
- [x] 2.4 dev 站實測（`student1@test.com`，啟動豐盛**未**解鎖）：`GET /user/pa269001/learning` → 200（三張書籍卡片皆在）；`GET /user/pa269001/learning/2` → **200**（不再 redirect，因 `getCatalogOutline(2)` 已有值）、頁面顯示「啟動豐盛」標題 + 鎖定訊息「需先報名並由講師開始上課」
- [~] 2.5 「於啟動豐盛新增筆記」**待人工實測**（同 2.3 帳號限制）；`createStudyEntry` 的大綱檢查由 1.4「33 項 `isValidOutlinePath` 全過」保證，解鎖檢查為 CR-003 既有邏輯（CR-011 已修 session 過期 bug）
- [x] 2.6 迴歸：`/user/pa269001/learning` 200、三張書籍卡片（啟動靈人／豐盛／得勝）皆正常渲染，啟動靈人（catalog 1）大綱未受影響（`getOutlineCatalogIds` 仍含 1、`build` 通過）

## 3. 文件與版本號同步

- [x] 3.1 `doc/學員手冊.md` 第八章「我的學習（分段查經）」小節：「目前只有啟動靈人開放」改為「啟動靈人與啟動豐盛皆已開放（各 12 課）；啟動得勝待日後開放」；檔首版本 v0.1.179 → v0.1.181（2026-08-28）
- [x] 3.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：`grep` 確認無「分段查經」／「我的學習」相關內容，不需更新
- [x] 3.3 `config/version.json`：`0.1.180` → `0.1.181`，`updatedAt` 維持 `2026-08-28`
