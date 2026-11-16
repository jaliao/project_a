## 1. 資料層：可見性判斷

- [x] 1.1 `lib/data/learning-study.ts` 新增 `getViewableLearningCatalogIds(viewerId, authorId): Promise<number[]>`：本人／好友（`isFriend`，引入 `lib/data/friendship.ts`）／同班（比對 `InviteEnrollment.inviteId` 交集）三條件任一成立即回傳對應課程目錄 id
- [x] 1.2 同檔新增 `canViewLearningCatalog(viewerId, authorId, courseCatalogId): Promise<boolean>`（包裝 1.1，供單一課程目錄子頁路由守衛使用）
- [x] 1.3 確認 1.1／1.2 皆不修改 `LearningStudyEntry`、`InviteEnrollment`、`Friendship` 既有查詢以外的任何資料表結構

## 2. 書籍選擇頁 `/user/{spiritId}/learning`

- [x] 2.1 `app/[locale]/(user)/user/[spiritId]/learning/page.tsx`：非本人時改為先查 `getViewableLearningCatalogIds`，有可見目錄則渲染唯讀模式（僅列出可見目錄），無可見目錄維持現行 redirect
- [x] 2.2 唯讀模式下頁面標題文案調整為「{displayName} 的分段式查經」（他人視角），本人視角文案不變；新增對應 i18n key（`learning` namespace），不寫死中文
- [x] 2.3 唯讀模式下課程目錄卡片僅渲染可見目錄；他人視角 `canEnter` 依是否有大綱決定（viewableIds 已保證已解鎖），有大綱即可進入
- [x] 2.4 「返回」連結：他人唯讀視角下仍指向該學員的 `/user/{spiritId}`，不指向查看者自己

## 3. 單一課程目錄子頁 `/user/{spiritId}/learning/{catalogId}`

- [x] 3.1 `app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`：非本人時改為先查 `canViewLearningCatalog`，可見則渲染唯讀模式，不可見則維持現行 redirect（導向查看者本人同一 `catalogId` 子頁）
- [x] 3.2 `components/learning/lesson-accordion.tsx` 新增 `readOnly?: boolean` prop（預設 `false`，向下傳遞至 `LessonEntriesPanel`），`readOnly` 時尚無筆記的經文格不渲染建立表單，改顯示靜態「尚未填寫」提示
- [x] 3.3 `components/learning/study-entry-card.tsx` 新增 `readOnly?: boolean` prop，`readOnly` 時隱藏「編輯」按鈕
- [x] 3.4 orphan 筆記區塊唯讀模式下同樣隱藏編輯按鈕
- [x] 3.5 唯讀模式頁面標題文案調整為「{displayName} 的分段式查經 {書籍名}」，沿用既有 i18n 慣例
- [x] 3.6 課次展開/收合 `localStorage` 記憶邏輯確認不受唯讀模式影響（既有 key 僅依 `courseCatalogId` 區分，未逐 `spiritId`，本次未變更此既有行為，與唯讀模式無關）

## 4. 個人首頁學習進度三卡可點擊範圍

- [x] 4.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：他人視角時額外呼叫 `getViewableLearningCatalogIds(viewer.id, user.id)`，結果傳入 `CourseProgressCards`
- [x] 4.2 `components/learning/course-progress-cards.tsx` 新增 `viewableCatalogIds: number[]` prop，`linkable` 條件由 `isOwnPage && ...` 改為 `(isOwnPage || viewableCatalogIds.includes(course.id)) && ...`
- [x] 4.3 確認本人視角呼叫端可傳入空陣列（`isOwnPage` 已短路，不影響結果）

## 5. 驗證

- [x] 5.1 已以 dev DB 真實資料直接呼叫 `getViewableLearningCatalogIds`／`canViewLearningCatalog` 驗證：同班（同 `inviteId=1` approved）viewer 對 author 回傳 `[1]`、`canViewLearningCatalog` 為 `true`；隨機取樣的無關聯兩人回傳 `[]`
- [x] 5.2 已以 dev DB 真實好友資料驗證：owner 查看 friend 回傳 friend 全部已解鎖課程目錄（`[1, 2]`，與 author 實際已解鎖目錄一致）；反向（friend 未加 owner 為好友）驗證不因好友方向自動互惠，僅在另有同班關係時才可見（符合「單向好友不互惠」情境）
- [x] 5.3 程式碼層級確認：`createStudyEntry`／`updateStudyEntry` 既有擁有者驗證未異動；`StudyEntryCard`／`LessonEntriesPanel` 於 `readOnly` 時不渲染編輯按鈕與建立表單。未另外啟動完整 Next.js 伺服器以瀏覽器直接呼叫 Server Action 驗證無權限回應（屬既有既定行為，本次未更動該驗證邏輯）
- [x] 5.4 已以 dev DB 真實資料驗證「同一人同課程目錄兩筆 approved 報名」情境：author 在 `courseCatalogId=1` 有兩筆 approved 報名（`inviteId` 344／404），僅屬於 344 的同學查詢結果仍包含 `catalogId=1`（可見 author 該目錄全部筆記，不限 344 梯次）
- [x] 5.5 程式碼層級確認 `linkable` 條件已正確改為 `(isOwnPage || viewableCatalogIds.includes(course.id))`；未另外啟動瀏覽器實際點擊驗證（本機無可登入的瀏覽器測試環境，建議部署後人工驗證一次）
- [x] 5.6 已確認 `app/[locale]/(admin)` 與 `app/api` 下無任何引用 `learning-study`／`LearningStudyEntry` 的檔案
- [x] 5.7 `npm run lint` 與 `npm run build` 通過（另執行 `npx tsc --noEmit` 確認無型別錯誤；`build` 階段因本機無 DB 連線出現的 `prisma.church.findMany()`／`prisma.courseCatalog.findMany()` 連線錯誤屬既有環境限制，與本次異動無關，不影響 build 成功）

## 6. 文件同步

- [x] 6.1 依 CLAUDE.md 第 9 點，已更新 `doc/學員手冊.md`（分段式查經新增「同班／好友可唯讀查看」說明，並同步修改學習進度三卡「他人視角可點擊」描述；檔首版本標註同步更新）；已檢查 `doc/管理者操作手冊.md`、`doc/老師手冊.md`，兩者僅提及「分段式查經」為 Topbar 導覽項目，無涉及可見性細節，評估不需更新
- [x] 6.2 `config/version.json` patch 版本號 +1 為 `0.1.243`，`updatedAt` 更新為 `2026-11-16`；`README-AI.md` 索引版本號同步更新
- [x] 6.3 依 CLAUDE.md 第 8 點已更新 `ai-context/05-business-logic.md`（新增「分段式查經可見性規則：同班／好友唯讀查看」小節）與 `ai-context/07-current-tasks.md`（「已完成」清單最前面附加本次 CR 紀錄）
