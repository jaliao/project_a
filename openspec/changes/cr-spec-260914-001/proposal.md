## Why

學員目前無法主動表達「我想上課」的意願（含想上的課程、可配合的時間），老師端也沒有管道去瀏覽這些有意願的學員並主動聯繫。現有「媒合布告欄」（`/match-board`）只支援老師刊登課程讓學員報名（找課程），缺少反向「學員刊登意願、老師找學員」的管道，導致部分想上課但尚未被邀請的學員無法被老師看到。

## What Changes

- 學員首頁（`/user/[spiritId]` 本人頁）新增「我想上課」按鈕：點擊開啟對話框，可複選「想上的課程」（課程目錄）與「上課時間條件」（平日白天／平日晚上／假日／時間不拘／其他，複選；勾選「其他」需填寫補充說明），送出後建立/更新該學員的上課意願刊登；學員可隨時編輯或取消刊登。
- 新增「上課意願」資料模型（`LearningIntent`），每位學員至多一筆刊登中的意願紀錄。
- 媒合布告欄頁面（`/match-board`）改為頁籤結構：「找課程」（沿用既有公開招募課程列表，設為預設頁籤）與新增的「找學員」（列出目前刊登上課意願的學員卡片）。
- 「找學員」頁籤的學員卡片與社群頁「好友」頁籤共用同一張卡片呈現（頭像／顯示名稱＋性別圖示／單位／身分別標籤），並額外顯示該學員選擇的課程與時間條件；卡片操作依是否已為好友二擇一：尚未加好友時顯示「加好友」，已是好友時顯示「傳訊息」（沿用既有好友／傳訊息機制，不建立新的授權規則）。

## Capabilities

### New Capabilities
- `learning-intent`：學員「上課意願」資料模型、首頁「我想上課」按鈕與選課程／選時間條件的刊登／編輯／取消刊登流程
- `student-matching-tab`：媒合布告欄「找學員」頁籤，列出刊登中意願的學員卡片，並提供加好友／傳訊息操作入口

### Modified Capabilities
- `course-public-matching`：媒合布告欄頁面改為「找課程／找學員」頁籤結構，原有公開招募課程列表内容作為「找課程」頁籤（預設）呈現，其餘既有規則（公開條件、排序、卡片內容）不變

## Impact

- **資料庫（Prisma）**：新增 `LearningIntent` model（`userId` 唯一、`courseCatalogIds Int[]`、`timePreferences` 列舉陣列、`otherNote`）與 `LearningTimePreference` enum；需 `make schema-update`。
- **路由／頁面**：`app/[locale]/(user)/user/[spiritId]/page.tsx`（新增按鈕，僅本人頁顯示）、`app/[locale]/(user)/match-board/page.tsx`（改為頁籤 wrapper）。
- **新元件**：上課意願對話框（選課程＋選時間條件）、找學員頁籤列表／學員卡片（與 `components/community/friends-list.tsx` 的卡片呈現共用/抽取共用子元件）。
- **Server Actions／Data Layer**：`app/actions/learning-intent.ts`（建立／更新／取消刊登）、`lib/data/learning-intent.ts`（查詢刊登中學員清單）；`app/actions/friendship.ts` 新增以 `userId` 直接加好友的動作供卡片使用（沿用既有 `Friendship` 單向加好友邏輯，不改變其授權規則）。
- **i18n**：`messages/zh-TW.json`／`messages/en.json` 新增 `learningIntent` 命名空間與 `matchBoard` 頁籤相關文案（依專案規範不得寫死中文）。
- 不影響現有 `course-public-matching`、`community-friends` 的既有 API／資料模型。
