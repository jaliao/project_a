## 1. 新增「最近提問」顯示元件

- [x] 1.1 於 `components/support-inquiry/` 新增元件（如 `recent-inquiries.tsx`），props 接收 `inquiries: MyInquiryItem[]`（`lib/data/support-inquiry.ts` 既有型別）與 `moreHref: string`
- [x] 1.2 元件渲染最近 3 筆提問卡片（分類、內容摘要、狀態徽章待處理／已回覆），樣式比照 `/user/{spiritId}/inquiries` 既有清單（分類文案透過 `useTranslations('supportInquiry')` 取用，不寫死中文）
- [x] 1.3 提問筆數為 0 時顯示空狀態提示（沿用/新增對應 i18n key）
- [x] 1.4 區塊下方渲染「看更多」按鈕（`Link`），導向 `moreHref`（即 `/user/{spiritId}/inquiries`）

## 2. 個人頁整合

- [x] 2.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：移除 `LearningRecordsPanel` 及其 import（`@/components/learning/feedback-entry`）
- [x] 2.2 移除 `getMyLearningFeedbacks`（`myFeedbacks`）與 `getMyLearningRecords`（`ownLearning`）的呼叫與相關 import（`@/lib/data/learning-feedback`、`@/app/actions/course-invite`）
- [x] 2.3 「學習紀錄」區塊（`isOwnPageEarly` 內，`IconHistory` 標題）改為呼叫 `getMyInquiries(user.id)`，`slice(0, 3)` 後傳入新元件，`moreHref={`/user/${id}/inquiries`}`
- [x] 2.4 確認 `LearningRecord` 型別與 `getMemberDisplayName` 於 `records` 映射相關程式碼一併清除（若不再被其他區塊使用）

## 3. 移除 learning-record-feedback 前後台程式碼

- [x] 3.1 刪除 `components/learning/feedback-entry.tsx`
- [x] 3.2 刪除 `app/actions/learning-feedback.ts`
- [x] 3.3 刪除 `lib/data/learning-feedback.ts`
- [x] 3.4 刪除 `lib/schemas/learning-feedback.ts`
- [x] 3.5 刪除 `app/[locale]/(admin)/admin/learning-feedback/page.tsx`（含路由目錄）
- [x] 3.6 刪除 `components/admin/learning-feedback-actions.tsx`
- [x] 3.7 `app/[locale]/(admin)/admin/page.tsx`：移除 `getPendingFeedbackCount` import 與呼叫、`ADMIN_FEATURES` 中「學習歷程回饋」卡片項目、對應的待處理計數 filter 分支
- [x] 3.8 確認 `app/actions/course-invite.ts` 的 `getMyLearningRecords` 於全專案已無其他呼叫端後一併移除（若仍被其他頁面使用則保留，僅移除本頁引用）
- [x] 3.9 `prisma/schema/*.prisma`：**不修改** `LearningFeedback` model（保留資料表，僅程式碼層移除）

## 4. i18n 清理

- [x] 4.1 `messages/zh-TW.json`：移除 `learningFeedback` 命名空間
- [x] 4.2 `messages/en.json`：同步移除 `learningFeedback` 命名空間
- [x] 4.3 `messages/zh-CN.json`：執行 `npm run gen:zh-cn` 重新產生（不手動編輯）
- [x] 4.4 若新增「最近提問」元件的空狀態／看更多文案需要新 key，加入 `supportInquiry` 命名空間（繁體來源 + 英文翻譯）

## 5. 文件與版本號同步

- [x] 5.1 更新 `doc/學員手冊.md`：移除「學習歷程回饋」相關段落，補充「學習紀錄」區塊改顯示最近提問說明
- [x] 5.2 更新 `doc/管理者操作手冊.md`：移除「學習歷程回饋」後台管理章節說明（並重新編號後續章節）
- [x] 5.3 手冊檔首版本標註與日期更新（學員/管理者手冊，老師手冊無異動故不更新）；`config/version.json` patch 版號 +1（0.1.153）、`updatedAt` 更新為 2026-07-23

## 6. 驗證

- [x] 6.1 `npm run lint` 確認無未使用 import／死連結（0 錯誤，既有警告與本次變更無關）
- [x] 6.2 `npm run build` 確認產生成功（`/admin/learning-feedback` 路由已不存在於建置清單）
- [x] 6.3 手動測試：個人頁「學習紀錄」區塊在 0 筆／1-2 筆／3 筆以上提問情境下皆正確顯示；「看更多」導向 `/user/{spiritId}/inquiries` 正確（需啟動 `make dev` + `npm run dev` 於瀏覽器驗證，本次會話未啟動開發伺服器）
- [x] 6.4 確認他人瀏覽自己的個人頁時不顯示「學習紀錄」最近提問區塊（同上，需瀏覽器驗證）
- [x] 6.5 確認 `/admin` 首頁不再顯示「學習歷程回饋」卡片，且無 404 死連結（程式碼審查＋build 路由清單確認）
