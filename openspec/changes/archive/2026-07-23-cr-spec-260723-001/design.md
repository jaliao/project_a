## Context

`cr-spec-260722-004` 剛把個人頁（`app/[locale]/(user)/user/[spiritId]/page.tsx`）的「學習紀錄」區塊從舊的學習歷程回饋，改為顯示最近 3 筆「聯繫管理者」提問（`RecentInquiries` 元件，直式清單＋底部「看更多」文字連結）。`/user/{spiritId}/inquiries`（「我的提問」頁）則維持原本 inline 的提問清單標記（分類、狀態徽章、內容、時間、回覆）與 `SupportInquiryForm` 送出表單。

本次變更是同一塊功能的呈現微調：個人頁標題更名、區塊改名為「聯繫管理者」並換成與 Topbar 一致的圖示、內容從清單改為卡片式（2 則提問卡＋1 張表單卡），且卡片內容要與 `/inquiries` 頁共用同一套顯示元件，避免兩處分別維護提問卡片的樣式。

## Goals / Non-Goals

**Goals:**
- 個人頁標題「學員資料」→「首頁」（`<title>` metadata 與可見 `<h1>`）。
- 個人頁「學習紀錄」區塊 → 「聯繫管理者」，圖示改用 `IconMessageCircle`（比照 Topbar），標題列可點擊導向 `/user/{spiritId}/inquiries`。
- 該區塊改為卡片式排版：最近 2 則提問卡片 + 1 張「填寫新提問」表單卡片（重用既有 `SupportInquiryForm`），提問筆數不足 2 則時卡片數量隨之減少（不補空白佔位卡）。
- 抽出共用 `InquiryCard` 顯示元件（分類、狀態徽章、內容、提問時間、回覆內容），供個人頁最近提問卡片與 `/inquiries` 頁清單共同使用。
- `/inquiries` 頁標題「我的提問」→「聯繫管理者」（`<title>` metadata、可見 `<h1>`），清單改用 `InquiryCard`。

**Non-Goals:**
- 不變更 `SupportInquiryForm` 的欄位、驗證邏輯或送出行為，僅改變其外層容器（加上卡片邊框，供首頁排版使用）。
- 不新增分頁或「查看全部」文字連結；瀏覽完整歷史一律透過區塊標題／icon 導頁至 `/inquiries`（不提供第二種入口）。
- 不變更 Topbar 本身的「聯絡管理者」按鈕（既有命名差一字「聯絡」vs「聯繫」為既有現況，非本次變更範圍）。
- 不變更資料層（`getMyInquiries`）查詢邏輯本身，僅呼叫端 `slice(0, 2)`。

## Decisions

1. **新增共用 `components/support-inquiry/inquiry-card.tsx`，取代 `/inquiries` 頁面既有 inline `<li>` 標記**
   將 `/inquiries` 頁面目前內嵌於 `.map()` 中的分類／狀態徽章／內容／時間／回覆區塊抽成獨立元件（props：單筆 `MyInquiryItem`），`/inquiries` 頁與個人頁最近提問卡片皆呼叫同一元件渲染，避免兩處樣式各自演化、日後修改需改兩處。

2. **`components/support-inquiry/recent-inquiries.tsx` 改寫為 `components/support-inquiry/contact-admin-cards.tsx`**
   舊元件僅負責「清單＋看更多連結」；新需求是「2 則提問卡＋1 張表單卡的網格」，職責已明顯不同，改用新檔名/元件名（`ContactAdminCards`）取代，避免舊名稱誤導。內部：
   - 提問卡：`inquiries.slice(0, 2).map(inq => <InquiryCard inquiry={inq} />)`，每張外層加 `rounded-lg border p-4`。
   - 表單卡：固定渲染於最後一格，`<div className="rounded-lg border p-4"><SupportInquiryForm /></div>`。
   - 版面：`grid grid-cols-1 sm:grid-cols-3 gap-3`（手機單欄堆疊，桌面三欄並排），與既有 `CourseCardGrid` 的響應式斷點慣例一致，但因固定最多 3 格、不需 `lg`/`xl` 再增欄，故不直接重用 `CourseCardGrid`（其為 4 欄設計，語意不符 3 格場景），改寫獨立的 grid class。
   - 0 則提問時：僅渲染表單卡（單欄）；1 則時：提問卡＋表單卡（2 格）；2 則以上：固定 2 提問卡＋表單卡（3 格），不做「看更多」以外的裁切提示（裁切本身即設計需求）。

3. **標題列導頁：整個標題列包成 `Link`，而非額外文字連結**
   個人頁「聯繫管理者」標題（icon＋文字）整列包在 `next/link` 的 `Link` 內，`href={/user/${id}/inquiries}`，並加 `hover:opacity-70 transition-opacity` 與小箭頭圖示（`IconChevronRight`）提示可點擊，取代舊有的獨立「看更多」文字連結（用戶已確認以標題列導頁取代，不另外保留第二入口）。

4. **`viewMore` i18n key 移除**
   `cr-spec-260722-004` 新增的 `supportInquiry.viewMore`（"看更多"）不再被使用，隨本次變更一併從 `messages/zh-TW.json`／`en.json` 移除（`zh-CN.json` 由既有腳本重新產生）。`myInquiriesTitle` key 內容由「我的提問」改為「聯繫管理者」（key 名稱不變，只改文案值，避免無謂重新命名擴大 diff）。

5. **個人頁標題**
   `metadata.title` 由 `'學員資料 — 啟動事工'` 改為 `'首頁 — 啟動事工'`；可見 `<h1>學員資料</h1>` 同步改為 `<h1>首頁</h1>`。此為純文案調整，不影響任何邏輯或路由。

## Risks / Trade-offs

- **[風險] 首頁卡片區塊資訊密度降低（僅 2 則 vs 原本 3 則），部份提問可能需多一次點擊才看得到** → 緩解：這是本次變更明確要的產品決策（2 則卡片＋表單卡優先於「看更多」），且標題列導頁已提供完整歷史入口，屬使用者已確認接受的取捨。
- **[風險] `InquiryCard` 需同時滿足個人頁卡片（較窄的 grid 欄位）與 `/inquiries` 頁（較寬的單欄清單）兩種寬度，內容較長時（如提問內容/回覆很長）在窄欄可能顯得侷促** → 緩解：內容區塊使用 `whitespace-pre-wrap` 讓文字自然換行（不做字數截斷），維持與 `/inquiries` 頁一致的完整呈現；如未來發現窄欄影響閱讀，可在後續變更加 `compact` prop 而非本次過度設計。
- **[風險] `viewMore` key 移除若有其他頁面誤用會造成缺字回退（顯示繁體）** → 緩解：先以 `grep` 確認全專案僅 `recent-inquiries.tsx`（即將整份取代）使用此 key，移除前後皆會 `npm run lint`／`build` 驗證。

## Migration Plan

1. 新增 `InquiryCard`，改寫 `/inquiries` 頁面改用該元件渲染清單（行為不變，純重構）。
2. 新增 `ContactAdminCards`（2+1 卡片網格＋標題列導頁邏輯），刪除 `recent-inquiries.tsx`，個人頁改接新元件。
3. 個人頁／`/inquiries` 頁標題文案調整（含 metadata 與 i18n key）。
4. 移除 `supportInquiry.viewMore` key（三語系檔）。
5. `npm run lint` + `npm run build` 驗證；因無 schema/migration 變動，無需 `make schema-update`。

**Rollback：** 純程式碼與文案變更，revert commit 即可還原，不涉及資料庫。

## Open Questions

（無）
