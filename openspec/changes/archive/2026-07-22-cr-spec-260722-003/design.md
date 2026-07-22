## Context

`cr-spec-260722-002` 建立的現況：Topbar「我需要幫助」（`IconHelpCircle`）點擊開啟 `ContactAdminDialog`（分類四選一＋內容，無課程關聯概念）；個人專區 `inquiries/page.tsx` 為純唯讀清單；後台 `/admin/support-inquiries` 為 table 呈現，逐列由 `SupportInquiryRow`（`components/admin/support-inquiry-actions.tsx`）以 `<tr>` fragment 展開回覆表單。

課程詳情頁（`app/[locale]/(user)/course/[id]/page.tsx` 約 L343-367）既有「操作按鈕」區塊：`{((canEditInfo && !isCancelled) || isInstructor) && (<div className="flex items-center gap-2 pt-1">...)}`，內含 `EditCourseInfoDialog`（`canEditInfo`）與 `CopyInviteLinkButton`（`isInstructor`，即 Share 按鈕）。

後台會員詳情頁（`app/[locale]/(admin)/admin/members/[id]/page.tsx`）以 shadcn `Tabs defaultValue="info"` 呈現 4 個既有分頁：`info`（基本資料，含姓名/英文名/暱稱/性別等 `<dl>`）、`hierarchy`、`teacher`、`special`。性別／所屬單位皆為行內三元運算式，無共用 helper（此為既有技術債，本次不重構，僅在新卡片元件內另行組出所需文字）。

三項關鍵決策已與使用者確認：Topbar 圖示改對話類、一般提問表單保留分類四選一（僅課程頁發起才自動固定+關聯課程）、後台改卡片式並在會員詳情頁與列表頁共用同一元件。

## Goals / Non-Goals

**Goals:**
- Topbar 圖示改 `IconMessageCircle`、移至訊息通知左邊、文案「聯絡管理者」、點擊改為導頁至 `/user/{spiritId}/inquiries`。
- 提問表單（分類四選一＋內容）從 Topbar Dialog 搬移為 `inquiries` 頁面內嵌區塊。
- 個人專區首頁移除「我的提問」入口區塊。
- 課程頁 Share 按鈕右邊新增「聯繫管理者」按鈕（同 `isInstructor` 顯示條件），開啟 Dialog、分類固定為課程問題、記錄 `courseInviteId`。
- 後台提問呈現改為共用卡片元件 `SupportInquiryCard`，含提問人真實姓名／性別／所屬單位、課程連結（如有）、會員頁連結；`/admin/support-inquiries` 與會員詳情頁新分頁「會員提問」皆使用此元件。

**Non-Goals:**
- 不重構全站性別／所屬單位顯示邏輯（`page.tsx`／`member-demographics-charts.tsx`／匯出路由三處重複邏輯維持現狀）。
- 不變更回覆／重新標記待處理的核心邏輯與通知機制（僅呈現層與資料來源調整）。
- 不支援課程提問的多輪對話（沿用既有「覆寫式」單一回覆語意）。
- 不限制一般提問表單的「課程問題」分類需綁定課程（維持自由文字，僅課程頁發起才自動關聯）。

## Decisions

### 1. 拆分表單核心與外殼：`SupportInquiryForm` + `ContactAdminDialog`
新增 `components/support-inquiry/support-inquiry-form.tsx`：純表單元件（分類 Select＋內容 Textarea＋送出按鈕），支援 `fixedCategory?: 'account' | 'course' | 'material' | 'other'`（提供時隱藏分類 Select、顯示固定分類文字）與 `courseInviteId?: number`（隨表單送出）兩個可選 props。
- `ContactAdminDialog`（課程頁專用）：Dialog 外殼包住 `SupportInquiryForm`，傳入 `fixedCategory="course"` 與當前 `courseInviteId`。
- `inquiries/page.tsx`：直接內嵌 `SupportInquiryForm`（無 Dialog 外殼、無 `fixedCategory`，維持四選一）。
- 替代方案：在同一元件內用 `asDialog` boolean 切換外殼。評估後認為「是否為 Dialog」與「表單內容邏輯」是兩個獨立關注點，分成外殼／核心兩元件更清晰，且課程頁與 inquiries 頁的使用情境本就不同（前者彈窗、後者頁面內嵌）。

### 2. Topbar 點擊行為改為導頁，移除本地 Dialog 狀態
`components/layout/topbar.tsx` 移除 `isContactAdminOpen` state 與 `<ContactAdminDialog>` 掛載，按鈕 `onClick` 改為 `router.push(spiritId ? /user/${spiritId}/inquiries : '/login')`（比照既有「個人資料」按鈕的 `router.push` 模式）。圖示改 `IconMessageCircle`，順序移至訊息通知（`IconBell`）按鈕之前。

### 3. `SupportInquiry` 新增 `courseInviteId Int?` 可選欄位
`courseInvite CourseInvite? @relation(fields: [courseInviteId], references: [id], onDelete: SetNull)`——課程本身不會被實體刪除（僅取消/結業狀態變化），`SetNull` 是保守預設，避免未來若有刪除情境牽連刪除提問記錄。一般 Topbar／個人專區提問此欄位恆為 `null`。

### 4. 後台查詢函式擴充為支援 `userId` 過濾，不新增獨立函式
`lib/data/support-inquiry.ts::getInquiryList` 新增可選 `userId` 參數（`opts: { status?, userId? }`），會員詳情頁「會員提問」分頁直接呼叫 `getInquiryList({ userId, status: 'all' })`，不另建 `getInquiriesByUserId`，避免重複查詢邏輯。回傳型別 `InquiryListItem` 擴充 `submitterRealName`／`submitterGender`／`submitterChurchLabel`／`courseInviteId`／`courseTitle`。
- 所屬單位文字（`churchLabel`）與性別文字（`genderLabel`）在 data layer 內就近組成純文字回傳（不建立跨頁共用 util，見 Non-Goals）。

### 5. `SupportInquiryCard` 取代 `SupportInquiryRow`，改為卡片式
新增 `components/admin/support-inquiry-card.tsx`：`<div>` 卡片（非 `<tr>`），內含摺疊/展開狀態，展開後同既有「完整內容＋回覆表單＋重新標記待處理」邏輯（沿用既有 `replyInquiry`／`reopenInquiry` action 呼叫）。新增顯示：提問人「顯示名稱（真實姓名）· 性別 · 所屬單位」＋「查看會員」連結（`target="_blank"` 至 `/admin/members/{userId}`，比照 `admin/learning-feedback` 既有 `IconExternalLink` 模式）；若 `courseInviteId` 有值，顯示「相關課程：{courseTitle}」連結（`target="_blank"` 至 `/course/{courseInviteId}`）。
`app/[locale]/(admin)/admin/support-inquiries/page.tsx` 由 table 容器改為 `<div className="space-y-3">` 卡片列表；`app/[locale]/(admin)/admin/members/[id]/page.tsx` 新增第 5 個 `TabsTrigger value="inquiries"` / `TabsContent`，呼叫 `getInquiryList({ userId: member.id, status: 'all' })` 並以同一 `SupportInquiryCard` 渲染。
刪除 `components/admin/support-inquiry-actions.tsx`（table row 版本），功能完全由新卡片元件取代。

### 6. 課程頁按鈕沿用 `isInstructor` 顯示條件
新按鈕與 `CopyInviteLinkButton` 放在同一個既有 `isInstructor &&` 區塊內（緊鄰其右），不擴大顯示範圍給一般學員——與 Share 按鈕本就限定「該課程講師」的既有邊界一致，最小化變動。一般學員若要反映課程相關問題，仍可透過 Topbar 一般入口手動選「課程問題」分類（不自動關聯，見 Non-Goals）。

## Risks / Trade-offs

- **[風險] Table → 卡片式屬於使用者可見的版面變動，管理者需重新適應** → 緩解：卡片保留與 table 相同的核心資訊密度（分類/內容/狀態/時間一目了然），僅外觀改變，操作邏輯（展開/回覆/重新標記）不變。
- **[風險] `ContactAdminDialog` 拆分為表單核心＋外殼，若 props 設計不慎可能讓 inquiries 頁與課程頁 Dialog 出現行為不一致（如驗證邏輯分岔）** → 緩解：驗證與送出邏輯完全收斂在 `SupportInquiryForm` 內部，外層（Dialog 或直接內嵌）僅負責容器與開關狀態，不重複實作驗證。
- **[風險] 移除 `SupportInquiryRow` 為破壞性重構** → 緩解：功能對等（同樣的展開/回覆/重新標記行為），刪除前確認新 `SupportInquiryCard` 已涵蓋所有既有 scenario 才移除舊檔。
- **[取捨] 性別/所屬單位顯示邏輯未抽成全站共用 util，僅在本次新卡片元件內另組一份** → 與既有三處重複邏輯一致（技術債不擴大也不解決），若未來要做全站重構，屆時一併處理本次新增的第四處。

## Migration Plan

1. `prisma/schema/support-inquiry.prisma` 新增 `courseInviteId`／`courseInvite` 關聯 → `make schema-update`。
2. 拆分 `SupportInquiryForm`（核心）＋調整 `ContactAdminDialog`（改用 `fixedCategory="course"` 模式）。
3. Topbar 圖示／位置／點擊行為調整。
4. `inquiries/page.tsx` 內嵌 `SupportInquiryForm`（一般模式）；個人專區首頁移除入口區塊。
5. 課程頁新增聯繫管理者按鈕＋ Dialog 串接 `courseInviteId`。
6. `lib/data/support-inquiry.ts`／`app/actions/support-inquiry.ts` 擴充（`userId` 過濾、`courseInviteId` 參數、新增顯示欄位）。
7. 新增 `SupportInquiryCard`，`/admin/support-inquiries` 與會員詳情頁「會員提問」分頁改用，刪除舊 `support-inquiry-actions.tsx`。
8. i18n 新增/調整 key（含既有「幫助」相關文案更名為「聯絡管理者」）。
9. 操作手冊與 `config/version.json` 同步。
10. `npm run lint` + `npm run build`；手動測試涵蓋一般提問與課程提問兩條路徑、後台卡片展開回覆、會員詳情頁新分頁。

無 DB 資料遺失風險（新增可選欄位）；如需回退，回退程式碼與 migration 即可（`courseInviteId` 欄位保留亦不影響既有資料）。

## Open Questions

（無，三項關鍵範圍已於 proposal 階段與使用者確認）
