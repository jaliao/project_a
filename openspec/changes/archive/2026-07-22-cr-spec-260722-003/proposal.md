## Why

上一版「聯繫管理者」功能（`cr-spec-260722-002`）上線後，需要依實際使用回饋做幾項調整：Topbar 入口的圖示與互動流程需優化（改為直接導頁而非彈窗，減少一次點擊）、需要支援「針對特定課程」的提問情境（讓講師/學員在課程頁直接反映該課程的問題，並自動記錄課程關聯）、後台需要更多提問人背景資訊（真實姓名、性別、所屬單位）以利管理者判斷，且提問呈現邏輯需重構為可在「提問管理列表」與「會員詳情頁」共用的元件，避免後續維護兩份邏輯。

## What Changes

- **Topbar**：「聯絡管理者」圖示由問號圓圈（`IconHelpCircle`）改為對話/客服類圖示（`IconMessageCircle`），移至「訊息通知」左邊；點擊後**不再彈出 Dialog**，改為直接導向個人專區 `/user/{spiritId}/inquiries`。文案由「我需要幫助」統一改為「聯絡管理者」。
- **個人專區 `inquiries` 頁面**：原本 Topbar 彈出的提問表單（分類四選一＋內容）搬移至此頁**內嵌顯示**（頁面同時具備「送出新提問」表單與「我的提問」清單）。
- **個人專區首頁**：移除先前新增的「我的提問」入口連結區塊（不再需要，直接由 Topbar 導頁）。
- **課程頁提問（新）**：課程詳情頁 Share 按鈕右邊新增「聯繫管理者」按鈕（與 Share 按鈕同一顯示條件，即該課程講師可見）；點擊開啟 Dialog 留言，分類**自動固定為「課程問題」**（不需選擇），並記錄 `courseInviteId` 建立與該課程的關聯。
- **資料模型**：`SupportInquiry` 新增 `courseInviteId Int?` 可選欄位＋ `courseInvite` 關聯，記錄提問來源課程（一般 Topbar／個人專區提問則為 `null`）。
- **後台提問呈現重構為共用卡片元件**：現有 `/admin/support-inquiries` 由 table 列表改為**卡片式**呈現（`SupportInquiryCard`），每張卡片顯示提問人**顯示名稱（真實姓名）、性別、所屬單位**，若有關聯課程則顯示課程連結（另開視窗至 `/course/{inviteId}`）；卡片含「看更多提問人資訊」連結（另開視窗至 `/admin/members/{userId}`）。
- **後台會員詳情頁**：新增第 5 個分頁「會員提問」（比照既有 `info`/`hierarchy`/`teacher`/`special` 分頁模式），顯示該會員的全部提問，**共用**上述 `SupportInquiryCard` 元件呈現。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `contact-admin`：Topbar 入口圖示／位置／互動流程改變（導頁取代彈窗）；提問表單搬移至 `inquiries` 頁面內嵌；個人專區首頁移除入口；新增課程頁提問入口（固定分類＋課程關聯）。
- `admin-inquiry-management`：列表呈現由 table 改為共用卡片元件，新增提問人背景資訊（真實姓名／性別／所屬單位）與課程關聯連結、會員頁連結。
- `topbar`：「我需要幫助」按鈕改名「聯絡管理者」、圖示與位置調整、點擊行為改為導頁。

## Impact

- **Schema**：`prisma/schema/support-inquiry.prisma` 新增 `courseInviteId`／`courseInvite` 關聯；需 `make schema-update` 產生 migration。
- **Data Layer**：`lib/data/support-inquiry.ts` 的 `getMyInquiries`／`getInquiryList` 需擴充 select（`realName`／`gender`／`churchType`／`churchId`／`church`／`churchOther`／`courseInviteId`／課程標題）與回傳型別；新增依課程建立提問所需的查詢，以及依會員 `userId` 查詢其全部提問（供會員詳情頁新分頁使用）。
- **Server Actions**：`app/actions/support-inquiry.ts::submitInquiry` 需接受可選 `courseInviteId` 參數。
- **UI**：
  - `components/layout/topbar.tsx`（圖示／位置／點擊行為）。
  - `components/support-inquiry/contact-admin-dialog.tsx` 需支援「固定分類＋課程關聯」模式（供課程頁使用），與「四選一」一般模式（供個人專區使用）共用核心邏輯。
  - `app/[locale]/(user)/user/[spiritId]/inquiries/page.tsx`（新增提交表單）、`app/[locale]/(user)/user/[spiritId]/page.tsx`（移除入口區塊）。
  - `app/[locale]/(user)/course/[id]/page.tsx`（新增聯繫管理者按鈕，鄰近 `CopyInviteLinkButton`）。
  - 新增 `components/admin/support-inquiry-card.tsx`（取代 `components/admin/support-inquiry-actions.tsx` 內的 table row 元件），供 `/admin/support-inquiries` 與 `/admin/members/[id]` 會員詳情頁共用。
  - `app/[locale]/(admin)/admin/members/[id]/page.tsx` 新增「會員提問」分頁。
- **不影響**：既有 `Gender`／`churchType` 顯示邏輯目前散落於 `page.tsx`／`member-demographics-charts.tsx`／匯出路由三處無共用 helper，屬既有技術債；本次僅為 support-inquiry 卡片元件另行組出所需顯示文字，**不**進行全站共用重構（超出本次範圍）。
