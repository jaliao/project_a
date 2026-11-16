## Why

「分段式查經」筆記（`LearningStudyEntry`）目前完全私人：`/user/{spiritId}/learning` 與其子頁兩層路由皆以 server-side redirect 強制僅本人可存取（`my-learning` spec「我的學習頁面路由與存取」明文排除他人與管理者後台可見）。使用者提出需求：希望同班同學（同一次具體開課）與自己加的社群好友，能夠互相唯讀查看彼此在同一課程目錄下的查經筆記內容，增加學員之間的互動與觀摩。

經與使用者討論確認設計方向：
- **不異動 `LearningStudyEntry` 資料表結構**，不新增欄位、不需 backfill 舊資料；可見範圍改為查詢時動態判斷，而非寫入時存快照。
- 「同班」定義為**同一次具體開課**（同一 `CourseInvite`/`inviteId`，雙方皆為 approved 報名）；「好友」沿用既有單向 `Friendship`（`isFriend(viewerId, authorId)`，查看者已將作者加入好友清單，不需對方同意或互加）。
- 已知取捨：若作者同一課程種類上過兩梯（兩筆 approved 報名），因筆記未記錄撰寫當下對應哪一梯，該作者兩梯的同學會一併被授權看到他在該課程種類下的所有筆記，不做精準區分到梯次。此情境預期少見，已與需求方確認可接受。
- 讀取權一律唯讀：筆記仍僅撰寫者本人可編輯/刪除；不新增個人隱私「設為不公開」開關；管理者後台不開放檢視學員查經筆記內容（維持現行排除）。

## What Changes

- 新增資料層判斷函式：給定 (viewerId, authorId, courseCatalogId) 判斷查看者是否可唯讀查看該作者在該課程目錄下的筆記（本人／同班／好友三條件之一即可）；並提供「該作者有哪些課程目錄對目前查看者可見」的清單版本，供書籍選擇頁與個人首頁進度卡重用。
- `/user/{spiritId}/learning`（書籍選擇頁）：訪客查看他人頁面時，若該他人至少有一個課程目錄對自己可見，**不再強制 redirect 回本人頁面**，改為顯示唯讀版本（僅列出可見的課程目錄，其餘目錄不顯示亦不可進入）；若一個可見目錄都沒有，維持現行 redirect 回本人頁面的行為不變。
- `/user/{spiritId}/learning/{catalogId}`（單一課程目錄子頁）：訪客查看他人頁面時，若該課程目錄對自己可見，顯示唯讀版本的課次清單與已填寫筆記內容（不提供新增/編輯表單、不提供任何寫入操作入口）；若不可見，維持現行 redirect 回本人對應頁面的行為不變。
- 個人首頁（`/user/{spiritId}`）「學習進度三卡」（`CourseProgressCards`）：他人視角下，進度卡若所屬課程目錄對目前查看者可見，卡片同樣可點擊進入該課程目錄的唯讀筆記子頁（沿用本人視角既有的可點擊樣式），取代現行「僅本人可點擊」的限制；不可見的課程目錄維持現行不可點擊的靜態卡片外觀不變。
- Server Action（`createStudyEntry`／`updateStudyEntry`）既有的登入／擁有者驗證**不放寬**，仍僅本人可寫入；本次異動純屬新增讀取路徑，不影響既有寫入授權邊界。
- 效能：新增的可見性判斷會查詢 `InviteEnrollment`／`Friendship`，初版以直接查詢實作；若後續資料量增長造成效能問題，實作時可評估加入快取或彙總索引等非正規化手段，不在本次強制要求範圍內。

## Capabilities

### Modified Capabilities
- `my-learning`：「我的學習頁面路由與存取」放寬為允許授權的他人（同班或好友）唯讀查看；新增「同班／好友唯讀查看他人筆記」Requirement。
- `student-profile-page`：「基本資料區塊 — 學習進度三卡」的卡片可點擊條件，從「僅本人」放寬為「本人／可唯讀查看該課程目錄」。

## Impact

- **後端**：新增 `lib/data/learning-study.ts`（或新檔）的可見性判斷函式；查詢面複用既有 `prisma.inviteEnrollment`、`lib/data/friendship.ts` 的 `isFriend`。
- **前端**：`app/[locale]/(user)/user/[spiritId]/learning/page.tsx`、`app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`、`components/learning/course-progress-cards.tsx`、`components/learning/lesson-accordion.tsx`、`components/learning/study-entry-card.tsx`（新增唯讀模式）。
- 不涉及資料庫 migration。
- 不影響既有「筆記撰寫／編輯」的授權邏輯與既有 Server Action。
