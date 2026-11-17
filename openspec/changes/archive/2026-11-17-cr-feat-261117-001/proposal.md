## Why

分段式查經可見性規則（`lib/data/learning-study.ts` 的 `getViewableLearningCatalogIds`／`canViewLearningCatalog`，CR-FEAT-261116-001 新增）目前只有「本人／好友／同班同學」三條件，缺少「講師與其課程學員」的關係：學生即使正在上某堂課，也看不到該堂課講師自己過去填寫的分段查經筆記。同時，兩個現有入口尚未提供通往個人首頁的捷徑：

- 課程詳情頁（`/course/[id]`，`app/[locale]/(user)/course/[id]/page.tsx:309-318`）以純文字 `<p>{teacherName}</p>` 顯示授課老師姓名，無連結。
- 社群頁（`/messages` 的「好友」頁籤與媒合布告欄「找學員」頁籤）共用的會員卡元件 `components/community/student-card.tsx` 顯示頭像與姓名，皆無連結到 `/user/{spiritId}`。

使用者提出需求：學生應能在課程頁點講師姓名、在社群頁點會員姓名或頭像，直接前往對方的個人首頁；且學生應能唯讀查看自己上課講師的分段查經筆記（增加師生互動與觀摩）。

經與使用者討論確認：「學生看講師」的可見範圍比照現行「同班」邏輯——僅該堂課對應的課程目錄可見，不擴大到講師所有已解鎖的課程目錄；本次僅開放「學生看講師」單向，不新增「講師看學生」或任何反向規則。

## What Changes

- 課程詳情頁的授課老師姓名改為可點擊連結，導向 `/user/{spiritId}`（講師 `spiritId` 為 `null` 時維持純文字，不產生連結）。
- 社群頁會員卡（`StudentCard`，「好友」頁籤與「找學員」頁籤共用）的頭像與姓名改為可點擊連結，導向 `/user/{spiritId}`（`spiritId` 為 `null` 時維持純顯示）。
- `lib/data/learning-study.ts` 的 `getViewableLearningCatalogIds` 新增第四條件「講師」：學生（viewer）在某堂課（`CourseInvite`，`createdById` 為該講師）有 `approved`、未取消的報名，且該堂課對應的課程目錄在講師（author）已解鎖的課程目錄集合內，則該課程目錄對該學生可見。`canViewLearningCatalog` 不需改動（已包裝 `getViewableLearningCatalogIds`）。
- 不新增「講師看學生」或任何反向規則；講師若需查看特定學生筆記，仍僅能透過既有好友或同班關係，不在本次範圍。

## Capabilities

### Modified Capabilities

- `course-session-detail`：「基本資訊區塊」Requirement 新增授課老師姓名可點擊連結的規則。
- `community-friends`：「好友清單頁籤與『點好友開對話』捷徑」Requirement 修改「好友卡片本身 SHALL NOT 需要可點擊」規則，改為頭像／姓名可點擊導向個人首頁。
- `student-matching-tab`：「找學員清單與學員卡片顯示」Requirement 補充卡片頭像／姓名同樣可點擊導向個人首頁（與好友卡片共用元件行為一致）。
- `my-learning`：「同班／好友唯讀查看他人筆記」Requirement 新增第四條件「講師」。

## Impact

- **後端**：`lib/data/learning-study.ts` 新增一個查詢分支；`lib/data/course-sessions.ts` 的 `getCourseSessionById` 查詢需在 `createdBy` 的 `select` 補上 `spiritId: true`（目前 `displayNameUserSelect` 不含此欄位）。
- **前端**：`app/[locale]/(user)/course/[id]/page.tsx`（授課老師姓名改為連結）、`components/community/student-card.tsx`（頭像／姓名改為連結）。`friends-list.tsx`、`match-board/student-matching-list.tsx` 兩個呼叫端不需改動（連結邏輯封裝於 `StudentCard` 內部）。
- 不涉及資料庫 migration。
- 不影響既有「筆記撰寫／編輯」的授權邏輯，也不影響既有好友／同班可見性條件。
