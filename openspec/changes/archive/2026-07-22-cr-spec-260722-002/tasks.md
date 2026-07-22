## 1. Schema 與 Migration

- [x] 1.1 新增 `prisma/schema/support-inquiry.prisma`：`SupportInquiryCategory` enum（`account`/`course`/`material`/`other`）、`SupportInquiryStatus` enum（`pending`/`replied`，預設 `pending`）。
- [x] 1.2 `SupportInquiry` model：`id`、`userId` + `user` 關聯、`category`、`body String @db.Text`、`status`（預設 `pending`）、`replyBody String?`、`repliedById String? @db.Uuid` + `repliedBy User?` 關聯、`repliedAt DateTime?`、`createdAt DateTime @default(now())`、`@@index([status, createdAt])`、`@@map("support_inquiries")`。
- [x] 1.3 `prisma/schema/user.prisma`：`User` model 新增對應的反向關聯欄位（提問者關聯、回覆者關聯，比照 `LearningRecordFeedback` 的 `"FeedbackSubmitter"`/`"FeedbackResolver"` 具名關聯模式，避免同一 model 對 `User` 有兩條關聯時的歧義）。
- [x] 1.4 `make schema-update name=add_support_inquiry` 產生並套用本地開發庫 migration。
- [x] 1.5 `make prisma-status` 確認 migration 狀態正常。

## 2. Zod 驗證 Schema

- [x] 2.1 新增 `lib/schemas/support-inquiry.ts`：`createInquirySchema`（`category` enum 必選、`body` 必填非空字串，錯誤訊息比照既有慣例使用 `validation.*` i18n key）。
- [x] 2.2 `lib/schemas/support-inquiry.ts`：`replyInquirySchema`（`replyBody` 必填非空字串，`validation.*` key）。

## 3. Data Layer

- [x] 3.1 新增 `lib/data/support-inquiry.ts`：`getMyInquiries(userId)` — 取得學員自己的提問清單（依 `createdAt` 倒序），含回覆管理者顯示名稱（比照 `getMemberDisplayName` 用法）。
- [x] 3.2 `lib/data/support-inquiry.ts`：`getInquiryList(opts: { status?: 'pending' | 'replied' })` — 後台列表查詢，含提問人顯示名稱。
- [x] 3.3 `lib/data/support-inquiry.ts`：`getPendingInquiryCount()` — 供後台首頁待處理數量卡片使用（比照 `getPendingFeedbackCount`/`getMaterialTodoCount`）。

## 4. Server Actions

- [x] 4.1 新增 `app/actions/support-inquiry.ts`：`submitInquiry(formData)` — 驗證 session、以 `createInquirySchema` 驗證、建立 `SupportInquiry` 記錄，`revalidatePath` 個人專區提問頁。
- [x] 4.2 `app/actions/support-inquiry.ts`：`replyInquiry(inquiryId, formData)` — 驗證管理者權限（`canAccessAdmin`）、以 `replyInquirySchema` 驗證、寫入 `replyBody`/`repliedById`/`repliedAt`、`status = 'replied'`，成功後呼叫 `createNotification(inquiry.userId, ...)` 通知學員，`revalidatePath` 後台提問頁與該學員個人專區提問頁。
- [x] 4.3 `app/actions/support-inquiry.ts`：`reopenInquiry(inquiryId)` — 驗證管理者權限，僅將 `status` 改回 `pending`，不清空 `replyBody`/`repliedById`/`repliedAt`。

## 5. UI — Topbar 入口與提問 Dialog

- [x] 5.1 新增 `components/support-inquiry/contact-admin-dialog.tsx`：Dialog 含分類 `Select`（四選項）與內容 `Textarea`，送出呼叫 `submitInquiry`，成功顯示 toast 並關閉。
- [x] 5.2 `components/layout/topbar.tsx`：新增「我需要幫助」圖示按鈕（`variant="ghost" size="icon"`，比照既有按鈕群組樣式），點擊開啟 `ContactAdminDialog`（`useState` 控制開關，比照 `NotificationDrawer` 開關模式）。
- [x] 5.3 檢查 Topbar 於行動裝置寬度下的按鈕群組排列（現有 5 個按鈕 + 新增 1 個），確認不溢出、間距可接受。

## 6. UI — 個人專區「我的提問」

- [x] 6.1 新增 `app/[locale]/(user)/user/[spiritId]/inquiries/page.tsx`：呼叫 `getMyInquiries`，列表顯示分類、內容、狀態 Badge（待處理／已回覆）、回覆內容與回覆管理者顯示名稱、回覆時間、提問時間；無資料時顯示空狀態。
- [x] 6.2 於個人專區首頁（`app/[locale]/(user)/user/[spiritId]/page.tsx`）新增「我的提問」入口連結（比照既有「課程列表」入口 `Link href="/user/{id}/courses"` 的呈現方式；此頁尚未 i18n 化，入口文字比照周遭風格維持硬編碼繁體，不單獨引入 next-intl）。

## 7. UI — 後台提問管理

- [x] 7.1 新增 `app/[locale]/(admin)/admin/support-inquiries/page.tsx`：分頁籤（待處理／已回覆／全部，比照 `admin/learning-feedback` 的 `TABS` 模式）＋列表（分類、提問人、內容摘要、狀態 Badge、提問時間）。
- [x] 7.2 新增 `components/admin/support-inquiry-actions.tsx`：展開詳情顯示完整提問內容；回覆表單（`Textarea` 預帶入既有 `replyBody`，送出呼叫 `replyInquiry`）；已回覆狀態顯示「重新標記待處理」按鈕（呼叫 `reopenInquiry`）。
- [x] 7.3 `app/[locale]/(admin)/admin/page.tsx`：新增「提問管理」功能卡片，顯示 `getPendingInquiryCount()` 待處理數量（比照既有教材/學習歷程回饋卡片樣式），連結至 `/admin/support-inquiries`。

## 8. i18n

- [x] 8.1 `messages/zh-TW.json` 新增 `supportInquiry` 命名空間（比照 `learningFeedback` 命名空間結構）：分類標籤、狀態標籤、Dialog 文案、個人專區文案、後台文案共 34 個 key。**範圍調整**：`createNotification()` 呼叫端比照既有慣例（`course-order.ts` 等既有呼叫處皆直接寫死繁體文字，非 key），回覆通知標題/內容直接寫死繁體字串，不建立 i18n key（與既有通知系統現況一致，避免本次單獨為通知內容引入 i18n 而與既有呼叫端不一致）。
- [x] 8.2 `nav` 命名空間新增 `help`（「我需要幫助」）key，供 Topbar 使用。
- [x] 8.3 `messages/en.json` 補譯 8.1／8.2 新增的所有 key。
- [x] 8.4 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`。

## 9. 操作手冊與版本號

- [x] 9.1 檢查並修正 `doc/學員手冊.md`：新增「聯繫管理者」操作說明（Topbar 入口、分類選擇、個人專區檢視回覆），新增第十四章。
- [x] 9.2 檢查並修正 `doc/管理者操作手冊.md`：新增「提問管理」章節（後台位置、分頁籤、回覆流程、重新標記待處理），新增第十九章＋附錄權限表新增一列。
- [x] 9.3 檢查 `doc/老師手冊.md`：於「常見問題」章節新增一則 Q&A 引用學員手冊對應章節（老師與學員共用同一入口，不需獨立新章節）。
- [x] 9.4 三份手冊檔首版本標註與日期同步更新（皆為 v0.1.151／2026-07-22，順手修正三份手冊檔尾殘留的過舊版本註記）。
- [x] 9.5 `config/version.json` patch 版本號 +1（0.1.150 → 0.1.151），`updatedAt` 更新為當日日期。

## 10. 驗證

- [x] 10.1 `npm run lint` 通過。
- [x] 10.2 `npm run build` 通過。
- [x] 10.3 手動測試：學員於 Topbar 送出提問（各分類各一次）→ 個人專區「我的提問」顯示待處理狀態。
- [x] 10.4 手動測試：管理者於後台回覆提問 → 狀態轉已回覆 → 學員 Topbar 通知鈴鐺與 `/notifications` 出現提醒 → 個人專區顯示回覆內容與回覆管理者顯示名稱。
- [x] 10.5 手動測試：管理者重新標記已回覆提問為待處理 → 回覆內容未被清空 → 學員端仍可見最後一次回覆內容。
- [x] 10.6 手動測試：後台分頁籤（待處理／已回覆／全部）篩選正確；後台首頁待處理數量卡片數字正確。
- [x] 10.7 手動測試：切換 zh-TW/en/zh-CN，確認提問 Dialog、個人專區、後台頁面文案皆正確在地化，無裸 i18n key 顯示。
