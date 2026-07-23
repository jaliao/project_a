## Why

`cr-spec-260722-004` 剛把個人頁「學習紀錄」區塊改為顯示最近提問清單＋「看更多」文字連結，但實際檢視後發現呈現方式不夠直覺：區塊命名沿用舊的「學習紀錄」、清單為條列式而非卡片、且送出新提問仍須跳頁。本次變更是同一功能的呈現微調，讓「聯繫管理者」的識別（命名、icon）與 Topbar 一致，並讓學員在首頁就能直接完成送出新提問，不必跳頁。

## What Changes

- 個人頁（`/user/{spiritId}`）頁面標題由「學員資料」改為「首頁」（`<title>` metadata 與頁面可見 `<h1>` 皆調整）。
- 個人頁「學習紀錄」區塊 **BREAKING**：
  - 區塊標題與 icon 由「學習紀錄」／`IconHistory` 改為「聯繫管理者」／`IconMessageCircle`（與 Topbar「聯絡管理者」按鈕圖示一致）。
  - 區塊標題（含 icon）可點擊，導向 `/user/{spiritId}/inquiries`。
  - 內容由「最近 3 則直式清單＋看更多連結」改為**卡片式排版**：僅顯示最近 **2 則**提問卡片，右側再加 **1 張填寫表單卡片**（供直接於首頁送出新提問，不需跳頁）；移除原本的「看更多」文字連結（改由區塊標題導頁承接）。
- 抽出共用「提問卡片」元件，內容比照 `/user/{spiritId}/inquiries` 頁面既有的提問清單卡片（分類、內容、狀態徽章、回覆內容等），供首頁最近提問卡片與「我的提問」頁面清單共用，避免兩處樣式各自維護。
- `/user/{spiritId}/inquiries` 頁面標題由「我的提問」改為「聯繫管理者」（`<title>` metadata 與頁面 `<h1>` 皆調整；清單改用上述共用卡片元件渲染）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `contact-admin`：修改 `cr-spec-260722-004` 新增的「個人頁學習紀錄區塊嵌入最近提問」需求——呈現方式由條列清單＋看更多連結，改為 2 則提問卡片＋1 張表單卡片的卡片式排版，區塊標題／icon 改為「聯繫管理者」並可點擊導頁；同時新增「我的提問」頁面標題更名為「聯繫管理者」的需求。

## Impact

- **Affected code**：
  - `app/[locale]/(user)/user/[spiritId]/page.tsx`（頁面標題、學習紀錄區塊標題/icon/導頁、改用新的卡片排版元件）
  - `components/support-inquiry/recent-inquiries.tsx`（重寫為 2 則提問卡片＋1 張表單卡片的排版，移除看更多連結）
  - 新增共用卡片元件（如 `components/support-inquiry/inquiry-card.tsx`），從 `/inquiries` 頁面既有 inline 標記抽出
  - `app/[locale]/(user)/user/[spiritId]/inquiries/page.tsx`（標題文案、清單改用共用卡片元件）
  - `messages/zh-TW.json` / `en.json`（`supportInquiry.myInquiriesTitle` 等文案調整；`viewMore` key 若不再使用則移除，`zh-CN.json` 依既有流程重新產生）
- **Dependencies**：無新增套件，沿用既有 `getMyInquiries`、`SupportInquiryForm`。
- **Docs**：依 CLAUDE.md 第 9 點同步檢查 `doc/學員手冊.md` 是否需微調對應段落用詞（首頁標題、聯繫管理者卡片呈現）。
