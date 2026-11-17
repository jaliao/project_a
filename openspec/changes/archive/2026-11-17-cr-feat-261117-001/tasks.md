## 1. 資料層：可見性判斷新增「講師」條件

- [x] 1.1 `lib/data/learning-study.ts` 的 `getViewableLearningCatalogIds` 於既有 `Promise.all` 新增第三條查詢：viewer 是否在某堂「`createdById = authorId`」的開課下有 `approved`、未取消的報名，且該開課對應課程目錄在 `authorUnlockedIds` 內；合併進回傳的可見課程目錄集合
- [x] 1.2 確認 `canViewLearningCatalog` 不需改動（已包裝 1.1 的回傳結果）
- [x] 1.3 確認新增查詢不檢查 `invite.startedAt`（與「同班」條件中 viewer 側查詢一致），且不影響既有本人／好友／同班三條件的既有行為

## 2. 課程詳情頁授課老師姓名連結

- [x] 2.1 `lib/data/course-sessions.ts:350` 的 `createdBy: { select: { ...displayNameUserSelect, phone: true } }` 補上 `spiritId: true`（另補上 `CourseSessionItem` 型別定義中 `createdBy.spiritId: string | null`，否則 `tsc` 報錯）
- [x] 2.2 `app/[locale]/(user)/course/[id]/page.tsx:309-318`：授課老師姓名 `spiritId` 非空時改為 `Link` 導向 `/user/<spiritId 小寫>`，新分頁開啟（`target="_blank"`、`rel="noopener noreferrer"`）；`spiritId` 為空時維持純文字 `<p>`

## 3. 社群會員卡（好友／找學員頁籤共用）頭像與姓名連結

- [x] 3.1 `components/community/student-card.tsx`：頭像（`UserAvatar`）與顯示名稱區塊，`spiritId` 非空時包成站內 `Link`（`@/i18n/navigation`）導向 `/user/{spiritId}`（同分頁）；`spiritId` 為空時維持純顯示
- [x] 3.2 確認 `friends-list.tsx`、`match-board/student-matching-list.tsx` 兩個呼叫端不需改動（`spiritId` 已作為既有 prop 傳入）
- [x] 3.3 確認連結點擊範圍不與卡片既有操作按鈕（傳訊息／刪除／釘選／加好友）互相干擾（連結僅包住頭像與顯示名稱區域，不包住整張卡片）

## 4. 驗證

- [x] 4.1 以 dev DB 真實資料驗證新增「講師」條件：以 `inviteId=1`（`createdById` 為某講師，該講師自己在 `courseCatalogId=1` 已解鎖）為 fixture，隨機取一名該 invite 下 approved 學員 → `getViewableLearningCatalogIds(學生, 講師)` 回傳 `[1]`、`canViewLearningCatalog` 為 `true`
- [x] 4.2 驗證講師條件不互惠：反向 `getViewableLearningCatalogIds(講師, 學生)` 回傳 `[]`（講師不因此自動看到該學生的筆記）
- [x] 4.3 驗證既有行為未受影響：隨機取樣無關聯兩人 `getViewableLearningCatalogIds` 仍回傳 `[]`（本人／好友／同班三條件查詢語句未變動，僅新增並列的第三條查詢）
- [x] 4.4 程式碼層級確認課程詳情頁（`spiritId ? <Link> : <p>`）與社群會員卡（`spiritId ? <Link>... : <>...`）皆以三元運算式區分，`spiritId` 為 `null` 時正確落入純顯示分支，不產生連結
- [x] 4.5 `npx tsc --noEmit`、`npm run lint`（12 筆既有警告、0 錯誤，與異動前基線一致）、`npm run build` 皆通過

## 5. 文件同步

- [x] 5.1 依 CLAUDE.md 第 9 點，已更新 `doc/學員手冊.md`（分段式查經新增「上課講師」唯讀查看條件；已核准學員名單新增授課老師姓名連結說明；好友頁籤卡片新增頭像/姓名連結說明，找學員頁籤因沿用同一卡片元件無需另改）；已更新 `doc/老師手冊.md`（課程基本資訊新增講師姓名連結、找學員頁籤新增連結說明、已核准學員區塊新增「分段式查經可見性」提醒）；已檢查 `doc/管理者操作手冊.md`，確認無相關內容，未修改
- [x] 5.2 `config/version.json` patch 版本號 +1 為 `0.1.244`，`updatedAt` 維持 `2026-11-16`；`README-AI.md` 索引版本號同步更新
- [x] 5.3 依 CLAUDE.md 第 8 點已更新 `ai-context/05-business-logic.md`（新增「分段式查經可見性規則補充：講師唯讀查看」小節）與 `ai-context/07-current-tasks.md`（「已完成」清單最前面附加本次 CR 紀錄）
