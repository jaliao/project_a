## 1. 資料模型（Prisma）

- [x] 1.1 於 `prisma/schema/` 新增 `LearningTimePreference` enum（`weekday_day`／`weekday_night`／`weekend`／`anytime`／`other`）
- [x] 1.2 新增 `LearningIntent` model：`userId`（`@unique @db.Uuid`，`User` 關聯、`onDelete: Cascade`）、`courseCatalogIds Int[]`、`timePreferences LearningTimePreference[]`、`otherNote String?`、`createdAt`、`updatedAt`
- [x] 1.3 執行 `make schema-update name=add_learning_intent`，確認 migration 成功套用

## 2. Data Layer

- [x] 2.1 新增 `lib/data/learning-intent.ts`：`getMyLearningIntent(userId)`（取得本人刊登中意願，含課程/時間條件供編輯預填）
- [x] 2.2 `lib/data/learning-intent.ts` 新增 `getMatchableStudents(excludeUserId)`：查詢所有 `LearningIntent`（排除自己），join `User` 取卡片所需欄位（比照 `lib/data/friendship.ts` 的 `unitLabel`/`displayName`/`avatarUrl` 計算方式），依 `createdAt` 新到舊排序，並批次計算是否已為好友（`Friendship` 批次查詢，優於逐筆 `isFriend`）
- [x] 2.3 `app/actions/friendship.ts` 抽出共用核心 `createFriendshipCore(me, targetId)`（含重複檢查、建立、通知），供既有 `addFriendBySpiritId` 與新 `addFriendByUserId` 共用（因含通知等 mutation 副作用，改置於 actions 層而非 data 層，符合專案「Data Layer 查詢 / Actions 處理 mutation」慣例）

## 3. Server Actions

- [x] 3.1 新增 `app/actions/learning-intent.ts`：`saveLearningIntent(input)`（zod 驗證：至少 1 門課程、至少 1 個時間條件、勾選 `other` 時 `otherNote` 必填；upsert by `userId`）
- [x] 3.2 `app/actions/learning-intent.ts` 新增 `cancelLearningIntent()`（刪除本人 `LearningIntent`）
- [x] 3.3 `app/actions/friendship.ts` 新增 `addFriendByUserId(targetUserId)`（呼叫共用核心 `createFriendshipCore`，含「不可加自己」檢查）
- [x] 3.4 上述 actions 皆先 `auth()` 驗證登入，`saveLearningIntent`／`cancelLearningIntent`／`addFriendByUserId` 成功後視情況 `revalidatePath`（`/user/[spiritId]`、`/match-board`）

## 4. Zod Schema

- [x] 4.1 於 `lib/schemas/` 新增上課意願表單 schema（課程 id 陣列 `min(1)`、時間條件陣列 `min(1)`、`other` 勾選時 `otherNote` 必填的 `superRefine`）

## 5. 共用元件抽取

- [x] 5.1 由 `components/community/friends-list.tsx` 抽出 `components/community/student-card.tsx`（`StudentCard`）：props 含頭像/顯示名稱/性別/單位/身分別標籤等基本欄位、`actions` slot（右下角操作區）、可選的「上課意願區塊」slot（課程/時間條件標籤）
- [x] 5.2 `FriendsList` 改為呼叫 `StudentCard`，傳入既有「釘選／傳訊息／刪除」三顆按鈕為 `actions`，確認好友頁籤視覺與行為與抽取前一致

## 6. 學員首頁「我想上課」

- [x] 6.1 新增 `components/dashboard/learning-intent-dialog.tsx`：課程複選清單（`getActiveCourses()`）、時間條件複選（平日白天／平日晚上／假日／時間不拘／其他）、`other` 勾選時顯示補充說明欄位，送出呼叫 `saveLearningIntent`；已刊登時預填現有選擇並提供「取消刊登」（`AlertDialog` 確認後呼叫 `cancelLearningIntent`）
- [x] 6.2 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`isOwnPage` 時查詢 `getMyLearningIntent`，顯示「我想上課」／「已刊登，編輯」按鈕並掛載對話框

## 7. 媒合布告欄頁籤化

- [x] 7.1 新增 `components/match-board/match-board-tabs.tsx`（client component）：shadcn `Tabs`（`courses`／`students`），比照 `messages-page.tsx` 以 `?tab=` query 同步、預設 `courses`
- [x] 7.2 `app/[locale]/(user)/match-board/page.tsx`：改為 server component 平行查詢既有公開課程列表與 `getMatchableStudents`，傳給 `MatchBoardTabs`；「找課程」頁籤沿用原有 `CourseCardGrid`／`CourseSessionCard` 渲染
- [x] 7.3 新增 `components/match-board/student-matching-list.tsx`：以 `StudentCard` 列出找學員清單（含課程/時間條件標籤、依好友狀態顯示「加好友」或「傳訊息」，點加好友成功後該卡即時切換為「傳訊息」）、空狀態提示
- [x] 7.4 「加好友」按鈕呼叫 `addFriendByUserId`；「傳訊息」按鈕沿用 `SendMessageButton`／`/messages?with=` 既有導向

## 8. i18n

- [x] 8.1 `messages/zh-TW.json` 新增 `learningIntent` 命名空間（按鈕文案、對話框標題、課程/時間條件選項標籤、驗證錯誤訊息、成功/取消提示）
- [x] 8.2 `messages/zh-TW.json` 的 `matchBoard` 命名空間新增頁籤文案（`tabCourses`／`tabStudents`／找學員空狀態）與學員卡片上課意願相關文案
- [x] 8.3 補齊 `messages/en.json` 對應翻譯；執行 `npm run gen:zh-cn` 產生簡體
- [x] 8.4 表單驗證訊息使用 `validation.*` key；本對話框為複選 Checkbox（非逐欄位表單），依 CLAUDE.md 第 12 點採 toast 顯示 `t(key)` 的方式呈現（非 `<FieldError>` 逐欄位呈現，無對應單一欄位可掛載）

## 9. 驗證

- [x] 9.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 9.2 `npm run build`（Compiled successfully，TypeScript 無錯誤；建置時的 `Can't reach database server at db` 為 host 端建置無法連容器內網 DB 的預期訊息，與本次改動無關）
- [x] 9.3 手動驗證：本人首頁刊登／編輯／取消上課意願；`/match-board` 找課程頁籤行為不變、找學員頁籤顯示卡片並可加好友/傳訊息；好友頁籤（`community-friends`）視覺與行為未回歸（**未執行**：本次 session 無瀏覽器操作工具可用，僅以 curl 對 `/user/[spiritId]`、`/match-board` 做未登入狀態的煙霧測試，確認頁面正常導向 `/login` 且無 500／Module 錯誤；實際登入後的互動流程仍待人工於瀏覽器實測）
- [x] 9.4 依 CLAUDE.md 規範同步 `doc/學員手冊.md`／`doc/老師手冊.md`（`doc/管理者操作手冊.md` 無異動角色，未修改）與 `config/version.json`（0.1.198→0.1.199，2026-09-14）、`README-AI.md` 版本行、`ai-context/04-data-model.md`（新增 `LearningIntent`）、`ai-context/07-current-tasks.md`（新增本次 CR 記錄）
