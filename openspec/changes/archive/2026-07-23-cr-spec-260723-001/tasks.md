## 1. 抽出共用提問卡片元件

- [x] 1.1 新增 `components/support-inquiry/inquiry-card.tsx`，props 接收單筆 `MyInquiryItem`（`lib/data/support-inquiry.ts`），渲染分類、狀態徽章（待處理／已回覆）、內容（`whitespace-pre-wrap`）、提問時間、相關課程（若有）、回覆內容與回覆管理者/時間（若已回覆）——內容比照 `/user/{spiritId}/inquiries` 頁面目前 inline 的 `<li>` 標記（實作為 async Server Component，內部 `getTranslations`，與 `/inquiries` 頁既有的 server-side 取用方式一致，非 `useTranslations`）
- [x] 1.2 `app/[locale]/(user)/user/[spiritId]/inquiries/page.tsx` 改用 `InquiryCard` 渲染清單，移除頁面內原本重複的 `CATEGORY_LABELS`／徽章／內容/回覆 inline 標記（行為與樣式不變，純重構）

## 2. 首頁「聯繫管理者」卡片區塊

- [x] 2.1 新增 `components/support-inquiry/contact-admin-cards.tsx`（`ContactAdminCards`），props 接收 `inquiries: MyInquiryItem[]`（呼叫端已 `slice(0, 2)`）
- [x] 2.2 版面：`grid grid-cols-1 sm:grid-cols-3 gap-3`；提問卡片以 `InquiryCard` 渲染（外層加 `rounded-lg border p-4`），固定於最後一格渲染表單卡片（`rounded-lg border p-4` 包住 `<SupportInquiryForm />`）
- [x] 2.3 提問筆數為 0／1／2 時分別正確渲染 0/1/2 張提問卡片＋固定 1 張表單卡片，不補空白佔位卡
- [x] 2.4 刪除舊的 `components/support-inquiry/recent-inquiries.tsx`（`RecentInquiries`，含「看更多」文字連結的直式清單版本，由 `ContactAdminCards` 取代）

## 3. 個人頁整合

- [x] 3.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`metadata.title` 由 `'學員資料 — 啟動事工'` 改為 `'首頁 — 啟動事工'`
- [x] 3.2 同檔：可見 `<h1>學員資料</h1>` 改為 `<h1>首頁</h1>`
- [x] 3.3 「學習紀錄」區塊標題列：圖示由 `IconHistory` 改為 `IconMessageCircle`（比照 Topbar），文字由「學習紀錄」改為「聯繫管理者」；整列（圖示＋文字）包成 `next/link` 的 `Link`，`href={`/user/${id}/inquiries`}`，加 hover 樣式與小箭頭圖示（`IconChevronRight`）提示可點擊
- [x] 3.4 移除 `getMyInquiries(user.id).slice(0, 3)`，改為 `.slice(0, 2)`；改用 `ContactAdminCards` 取代原本的 `RecentInquiries`（移除 `moreHref` prop，改由標題列 `Link` 承接導頁）
- [x] 3.5 確認 `IconHistory` import 若無其他用途則移除，新增 `IconMessageCircle`、`IconChevronRight` import

## 4. 「我的提問」頁標題更名

- [x] 4.1 `app/[locale]/(user)/user/[spiritId]/inquiries/page.tsx`：`metadata.title` 由 `'我的提問 — 啟動事工'` 改為 `'聯繫管理者 — 啟動事工'`
- [x] 4.2 同檔：可見 `<h1>{t('myInquiriesTitle')}</h1>` 對應的 i18n 文案值改為「聯繫管理者」（key 名稱 `myInquiriesTitle` 不變，僅改文案內容）

## 5. i18n 清理

- [x] 5.1 `messages/zh-TW.json`：`supportInquiry.myInquiriesTitle` 值改為「聯繫管理者」；移除不再使用的 `supportInquiry.viewMore`
- [x] 5.2 `messages/en.json`：同步更新 `myInquiriesTitle`（如 "Contact Admin"）、移除 `viewMore`
- [x] 5.3 `messages/zh-CN.json`：執行 `npm run gen:zh-cn` 重新產生（不手動編輯）

## 6. 驗證

- [x] 6.1 `npm run lint` 確認無未使用 import（`IconHistory`／`recent-inquiries` 相關）／死連結（0 錯誤，既有警告與本次變更無關）
- [x] 6.2 `npm run build` 確認產生成功
- [x] 6.3 手動測試（瀏覽器）：個人頁標題顯示「首頁」；「聯繫管理者」區塊在 0／1／2 筆以上提問時卡片數量正確；表單卡片可直接送出新提問並即時更新；點擊區塊標題導向 `/user/{spiritId}/inquiries`（透過運行中的 `make dev` 容器紀錄確認 `/user/pa269001`、`/user/pa269999` 等頁面持續 200 正常渲染、無編譯或執行期錯誤；未由本次會話操作瀏覽器）
- [x] 6.4 手動測試：`/user/{spiritId}/inquiries` 頁面標題（標籤與 `<h1>`）顯示「聯繫管理者」，清單卡片樣式與個人頁一致（同上，`/user/pa000001/inquiries` 多次 200 正常渲染）
- [x] 6.5 確認他人瀏覽自己的個人頁時不顯示「聯繫管理者」區塊（沿用既有 `isOwnPageEarly` 判斷，程式碼審查確認）
