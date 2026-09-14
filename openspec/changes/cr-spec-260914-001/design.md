## Context

現有「媒合布告欄」（`course-public-matching`）只有單向：老師將課程設為公開招募（`CourseInvite.isPublicMatch`），學員瀏覽 `/match-board` 報名。本次要新增反向管道：學員在首頁表達「我想上課」意願（含想上的課程＋可配合時間），老師到 `/match-board` 的新頁籤「找學員」瀏覽並主動加好友、傳訊息聯繫。

卡片呈現需與社群頁「好友」頁籤（`community-friends`）的好友卡片共用（頭像／顯示名稱＋性別圖示／單位／身分別標籤），該卡片目前寫在 `components/community/friends-list.tsx` 內未抽出獨立元件。

## Goals / Non-Goals

**Goals:**
- 學員可在首頁刊登／編輯／取消一筆「上課意願」（選課程＋選時間條件）
- 老師（或任何登入會員，比照找課程頁籤現況）可在媒合布告欄「找學員」頁籤瀏覽刊登中的學員
- 找學員卡片與好友卡片視覺一致（抽出共用元件），並依是否已為好友顯示「加好友」或「傳訊息」

**Non-Goals:**
- 不做「配對成功」的雙向確認流程（老師加好友／傳訊息後续溝通即視為媒合完成，不在系統內追蹤配對狀態）
- 不限制「找學員」頁籤僅講師身分可見（依 CR 確認：所有登入會員皆可查看，與「找課程」頁籤權限一致）
- 不做上課意願的到期／自動下架機制（僅由學員手動取消刊登）
- 不新增傳訊息或加好友的授權規則，全部沿用 `community-friends`／`contact-member` 既有機制

## Decisions

### 1. 一位學員僅一筆「進行中」的上課意願（`LearningIntent.userId` 唯一）
簡化為「刊登中／未刊登」二態，取消刊登直接刪除該筆記錄；再次點「我想上課」等同新建。編輯＝更新既有記錄（upsert by `userId`）。相較於「可刊登多筆意願（每課程一筆）」，選課程本身已支援複選，單筆記錄已能表達完整意願，避免多筆記錄的狀態管理複雜度。

### 2. `courseCatalogIds` 用 `Int[]` scalar array，不建關聯 join table
專案已有先例：`User.roles UserRole[]`。課程目錄選擇屬於「當下勾選快照」，不需要對 `CourseCatalog` 建立強關聯完整性（課程被下架後，舊意願仍可顯示曾選的課程 id／標籤即可，前端查無對應課程時以 fallback 文字處理，不影響刊登本身）。比對 join table 可省去額外的 N+1 查詢與 migration 複雜度。

### 3. 時間條件 `timePreferences` 用列舉陣列 `LearningTimePreference[]`
新增 enum `LearningTimePreference { weekday_day weekday_night weekend anytime other }`，複選存陣列，與 `roles` 同樣的陣列列舉模式。勾選 `other` 時 `otherNote` 為必填（表單層與 server action 皆驗證）；未勾 `other` 時 `otherNote` 應為 `null`（送出時由 server action 清除，避免殘留舊值）。

### 4. 抽出共用元件 `StudentCard`（`components/community/student-card.tsx`）
現有 `friends-list.tsx` 內的卡片 JSX（頭像／顯示名稱＋性別圖示／單位／身分別標籤）抽成 `StudentCard`，以 props 控制右下角操作區（好友頁籤傳入「釘選／傳訊息／刪除」三顆按鈕，找學員頁籤傳入「加好友」或「傳訊息」單顆按鈕＋上課意願區塊插槽）。`FriendsList` 改為呼叫 `StudentCard` 並傳入既有三顆按鈕作為 `actions` slot，行為不變（`community-friends` spec 不變）。

### 5. 找學員頁籤資料查詢與好友狀態判斷
`lib/data/learning-intent.ts` 提供 `getMatchableStudents(excludeUserId)`：撈出所有 `LearningIntent` 記錄（排除自己），join `User` 取得卡片所需欄位，依 `createdAt` 新到舊排序（比照 `course-public-matching` 排序慣例）；不做分頁與搜尋（與「找課程」頁籤現況一致，避免非對稱體驗）。是否已為好友於 server 端以既有 `isFriend(ownerId, friendId)`（`lib/data/friendship.ts`）逐筆判斷後傳給前端，避免前端再打 API。

### 6. 卡片「加好友」動作新增 `addFriendByUserId`
既有 `addFriendBySpiritId`（`app/actions/friendship.ts`）供 QR／掃碼／手動輸入啟動編號情境使用；找學員卡片已知對方 `userId`，直接以 `userId` 加好友較自然。抽出共用核心邏輯 `createFriendship(me, targetId)`，`addFriendBySpiritId` 查完 `spiritId` 換得 `userId` 後呼叫同一核心，`addFriendByUserId` 直接呼叫，兩者共用重複檢查／通知邏輯，避免邏輯分岔。

### 7. 頁籤實作沿用 `messages-page.tsx` 既有模式
`/match-board` 由 server component 一次撈好「找課程」課程列表與「找學員」學員列表（含每人是否已為好友），交給新的 client wrapper `MatchBoardTabs` 用 shadcn `Tabs`（`value`/`onValueChange`，可選 `?tab=courses|students` query 同步，比照 `messages-page.tsx` 的 `tab` 參數處理）切換兩個 `TabsContent`。

## Risks / Trade-offs

- [風險] `courseCatalogIds`／`timePreferences` 為 scalar array，未來若需要依「想上某課程的學員」反查（例如老師只看自己教的課程對應的學員），需用 Postgres 陣列運算子（`= ANY`／`&&`）查詢，效能與可讀性略遜於 join table → 緩解：目前需求僅需列表呈現不需複雜篩選，若後續有篩選需求再評估改關聯表（沿用 `Decisions #2` 的簡化取捨）。
- [風險] `StudentCard` 抽元件牽動既有 `community-friends` 好友卡片渲染，若抽取時遺漏既有 class/行為，可能造成好友頁籤 UI 回歸 → 緩解：抽取後以現有好友頁籤手動驗證（頭像／性別圖示／單位／身分標籤／釘選／傳訊息／刪除皆與抽取前一致），`community-friends` 既有 spec scenario 作為驗收基準。
- [風險] 找學員頁籤無分頁，若刊登意願學員數量成長可能列表過長 → 緩解：與「找課程」頁籤現況一致（非本次新增問題），後續如需分頁可比照 `community-friends` 好友清單的分頁模式擴充，非本次範圍。

## Migration Plan

1. `make schema-update name=add_learning_intent`：新增 `LearningIntent` model 與 `LearningTimePreference` enum（純新增，無破壞性變更，免特殊 reset 流程）。
2. 部署後既有學員預設無刊登記錄，首頁「我想上課」按鈕即可用；`/match-board` 找學員頁籤初期為空狀態，不影響既有「找課程」頁籤內容與行為。
3. 無需資料回填、無需 feature flag；可直接隨版本上線。
