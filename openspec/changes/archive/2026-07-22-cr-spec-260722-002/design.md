## Context

專案已有一個資料模型與流程都高度相似的既有功能可直接比照：`LearningRecordFeedback`（學習歷程回饋，`prisma/schema/learning-feedback.prisma`）——學員自助送出（`category` enum + 自由文字內容）、管理者於後台審核處理（`status` enum：`pending`/`approved`/`rejected`，含 `resolvedById`/`resolvedAt`/`adminNote`），後台頁面 `app/[locale]/(admin)/admin/learning-feedback/page.tsx` 已有「分頁籤（待處理/已處理/已婉拒/全部）＋列表＋展開詳情」的完整版面可直接參考。這比 proposal 原先設想的 `CourseMessage`（自關聯 parentId 留言串）更貼合本功能需求——提問是「一問一答＋狀態」而非多輪留言串，不需要自關聯設計。

既有通知機制：`createNotification(userId, title, body)`（`app/actions/notification.ts`），純文字通知、無分類/連結欄位，呼叫後 `revalidatePath('/', 'layout')`。Topbar 右上角按鈕群組（`components/layout/topbar.tsx`）已有固定模式：`Button variant="ghost" size="icon"` + `title` tooltip，點擊觸發 `router.push()` 或開啟 Drawer/Dialog（如 `NotificationDrawer`）。管理者身分判斷統一使用 `canAccessAdmin(roles)`（`lib/auth-roles.ts`），後台路由群組 `(admin)/layout.tsx` 已統一守衛，頁面內不需重複檢查。

## Goals / Non-Goals

**Goals:**
- 學員可於 Topbar 發起提問（分類：帳號問題／課程問題／購買教材問題／其他），送出後可於個人專區檢視自己的提問與回覆。
- 管理者可於後台看到全部提問、回覆、切換待處理／已回覆狀態，版面比照 `admin/learning-feedback` 既有模式。
- 回覆後透過既有 `createNotification()` 通知學員，不新建通知呈現機制。

**Non-Goals:**
- 不做多輪對話（一問一答＋管理者可覆寫回覆內容即可，不支援學員追問形成串接留言）。
- 不修改 `notification-inbox`／`topbar` 的既有訊息按鈕與 Drawer 呈現邏輯本身（僅新增「聯繫管理者」為另一個獨立入口按鈕，不合併進訊息 Drawer）。
- 不處理 `topbar`／`notification-inbox` 兩份 spec 現有的「訊息按鈕描述不同步」技術債（proposal 已註記排除）。
- 不做提問與特定課程/訂單的資料關聯（分類僅為文字標籤，不要求選擇具體課程或訂單編號；若學員提問內容涉及特定課程，於自由文字內容中自行描述）。

## Decisions

### 1. 資料模型比照 `LearningRecordFeedback` 而非 `CourseMessage`
新增 `SupportInquiry` model，獨立 `prisma/schema/support-inquiry.prisma`：
- `category SupportInquiryCategory`（enum：`account`/`course`/`material`/`other`）
- `body String @db.Text`（提問內容）
- `userId` + `user` 關聯（提問學員）
- `status SupportInquiryStatus @default(pending)`（enum：`pending`/`replied`）
- `replyBody String?`（回覆內容）
- `repliedById String? @db.Uuid` + `repliedBy User?`（回覆管理者，供前台顯示「回覆管理者顯示名稱」）
- `repliedAt DateTime?`（回覆時間）
- `createdAt DateTime @default(now())`
- `@@index([status, createdAt])`（比照 `LearningRecordFeedback` 索引風格，供後台列表依狀態篩選）

不採用 `CourseMessage` 的 `parentId` 自關聯設計：本功能狀態機（待處理/已回覆）與分類是核心需求，`CourseMessage` 沒有這兩個概念、且多輪留言串的資料模型會讓「後台待處理清單」查詢變複雜（需額外判斷最後一則是誰發的），不符合需求也徒增複雜度。

### 2. 回覆為「覆寫單一回覆欄位」而非新增回覆列
管理者回覆時直接寫入 `replyBody`／`repliedById`／`repliedAt`（若已回覆過，重新回覆即覆寫，非新增歷史列）。這對應 Non-Goal「不做多輪對話」；若管理者需要「重新標記待處理」（proposal 已確認需要待處理/已回覆狀態管理），僅重設 `status = pending`，`replyBody` 等既有回覆內容予以保留（不清空），學員仍可看到最後一次回覆內容，直到有新回覆覆寫。

### 3. 通知直接呼叫既有 `createNotification()`，不擴充其簽名
回覆時呼叫 `createNotification(userId, '您的提問已獲得回覆', body摘要)`，不修改 `createNotification` 簽名或新增分類/連結欄位——`Notification` model 本身沒有連結欄位，學員點通知後導向何處，比照現有其他呼叫端慣例（僅顯示文字，學員自行前往個人專區查看，不做深連結)。

### 4. Topbar 入口：獨立圖示按鈕＋Dialog（不掛使用者選單）
新增「我需要幫助」圖示按鈕（比照現有訊息鈴鐺／媒合布告欄按鈕的 `variant="ghost" size="icon"` 模式），點擊開啟 `ContactAdminDialog`（分類 Select + 內容 Textarea + 送出）。不掛在使用者下拉選單內，因為使用者描述「右上角可以點選」暗示為獨立可見按鈕，且與現有按鈕群組視覺一致。

### 5. 後台頁面版面比照 `admin/learning-feedback`
`app/[locale]/(admin)/admin/support-inquiries/page.tsx`：分頁籤（待處理／已回覆／全部）＋列表（分類、提問人、內容摘要、狀態 Badge、時間）＋展開詳情（完整內容＋回覆表單）。狀態 Badge 顏色沿用 `learning-feedback` 既有配色慣例（pending＝amber、replied＝green）。

### 6. 個人專區呈現位置
於 `app/[locale]/(user)/user/[spiritId]/` 新增 `inquiries/page.tsx` 子頁（比照既有 `courses/page.tsx` 為獨立子路由，而非塞進首頁 `page.tsx`），並於個人專區首頁或導覽處新增入口連結。列表顯示：分類、提問內容、狀態、回覆內容、回覆管理者顯示名稱（`getMemberDisplayName`，比照既有會員顯示名稱邏輯）、回覆時間。

## Risks / Trade-offs

- **[風險] `replyBody` 覆寫式設計，若管理者誤按重新回覆會蓋掉先前回覆內容且無歷史記錄** → 緩解：後台回覆表單預帶入目前 `replyBody`（若已有）作為預設值，避免管理者從空白重寫；不做歷史留存，因需求明確為單一回覆語意（如需完整歷史，屬未來擴充，非本次範圍）。
- **[風險] Topbar 新增按鈕若版面已擁擠（首頁/媒合布告欄/後台/個人資料/訊息鈴鐺已佔 5 個位置），行動裝置寬度可能不足** → 緩解：實作時檢查現有 Topbar 於手機寬度的呈現（專案為 mobile-first），必要時將部分按鈕收進既有的更多選單模式（若已存在），或確認 icon 間距可接受，不在此提前假設需要重構。
- **[風險] `SupportInquiryCategory` enum 新增值日後若要調整（如新增分類）需要 migration** → 緩解：與現有 `FeedbackCategory` 模式一致，日後新增分類比照既有教材版本新增 enum 值的既有流程（additive、向後相容）即可，不特別設計成可設定式清單。
- **[取捨] 不做多輪對話** → 若使用者反應需要學員追問，屬於後續擴充（改為留言串設計），本次先以「一問一答＋狀態」滿足明確需求，避免過度設計。

## Migration Plan

1. 新增 `prisma/schema/support-inquiry.prisma`（`SupportInquiryCategory`／`SupportInquiryStatus` enum ＋ `SupportInquiry` model）。
2. `make schema-update name=add_support_inquiry` 產生並套用本地開發庫 migration。
3. 依 tasks.md 實作 Server Actions（`lib/schemas/support-inquiry.ts` 驗證、`app/actions/support-inquiry.ts`）、Data Layer（`lib/data/support-inquiry.ts`）、UI（Topbar 入口、個人專區頁、後台頁）、i18n。
4. `npm run gen:zh-cn` 重新產生簡體語系檔。
5. `npm run lint` + `npm run build`。
6. 正式環境依現行流程部署 migration（新增 model，無既有資料相容性疑慮）。

無需 rollback 特殊處理：全新 model，無既有資料受影響。

## Open Questions

- Topbar 版面擁擠度是否需要額外設計（合併選單），留待實作時視覺確認再決定，不預先假設。
