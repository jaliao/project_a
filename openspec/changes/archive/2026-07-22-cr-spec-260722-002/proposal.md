## Why

目前學員遇到帳號、課程、購買教材或其他問題時，沒有系統內建的管道可以直接向管理者提問，只能透過站外方式（如私訊、電話）聯繫，管理者也缺乏集中處理與追蹤提問的介面。新增「聯繫管理者」功能，讓學員可於 Topbar 一鍵發起提問並分類，管理者於後台統一查看、回覆與追蹤處理狀態，回覆後透過既有通知系統提醒學員，並讓學員於個人專區隨時檢視自己的提問紀錄與回覆。

## What Changes

- Topbar 右上角新增「我需要幫助」入口，點擊後可選「聯繫管理者」，開啟提問 Dialog：選擇問題分類（帳號問題、課程問題、購買教材問題、其他）並填寫內容後送出。
- 學員個人專區（`user/[spiritId]`）新增「我的提問」區塊，顯示自己送出過的提問清單、分類、狀態（待處理／已回覆）、管理者回覆內容、回覆管理者顯示名稱與回覆時間。
- 後台新增「提問管理」頁面：列表顯示全部提問（分類、提問人、內容、狀態、時間），可展開查看詳情並回覆；回覆後狀態自動轉為「已回覆」，並可視需要重新標記為「待處理」（比照教材申請的階段化狀態管理慣例）。
- 管理者回覆提問後，SHALL 透過既有通知系統（`createNotification()`）建立通知，學員於 Topbar 訊息鈴鐺與 `/notifications` 歷史頁可看到「您的提問已獲得回覆」提醒。
- 新增資料模型（`SupportInquiry`）：提問分類、內容、狀態（pending/replied）、提問學員、回覆內容、回覆管理者、回覆時間；設計參考現有 `CourseMessage`（課程 FAQ 留言）的提問/回覆關聯模式，但獨立建模（分類與狀態為提問專屬概念，非留言串通用概念）。

## Capabilities

### New Capabilities

- `contact-admin`：學員發起提問（含分類選擇）、於 Topbar 開啟提問入口、於個人專區檢視自己的提問清單與回覆內容。
- `admin-inquiry-management`：後台提問管理列表、詳情展開、回覆、待處理／已回覆狀態切換。

### Modified Capabilities

- `topbar`：新增「我需要幫助」／「聯繫管理者」入口按鈕（`ADDED Requirement`，不變更既有按鈕行為）。

## Impact

- **Schema**：`prisma/schema/` 新增一個 model 檔案（暫名 `support-inquiry.prisma`），含 `SupportInquiry` model 與分類、狀態 enum；需 `make schema-update` 產生 migration。
- **Server Actions**：新增 `app/actions/support-inquiry.ts`（建立提問、後台回覆、狀態切換），回覆時呼叫既有 `app/actions/notification.ts::createNotification()`。
- **Data Layer**：`lib/data/support-inquiry.ts`（查詢學員自己的提問清單、後台全部提問清單）。
- **UI**：
  - `components/layout/topbar.tsx`（新增入口按鈕）＋新元件（提問 Dialog）。
  - `app/[locale]/(user)/user/[spiritId]/` 下新增提問清單區塊（沿用既有個人專區頁面風格，比照 `courses/page.tsx`）。
  - `app/[locale]/(admin)/admin/` 下新增「提問管理」頁面（比照現有 `admin/materials`、`admin/learning-feedback` 之列表＋展開詳情風格）。
- **i18n**：新增文案 key（分類標籤、狀態標籤、Dialog 文案、後台頁面文案），依現行慣例走 `messages/zh-TW.json` 為主、`en.json` 補譯、`zh-CN.json` 自動產生；本次僅新增 key，暫不涉及既有已知的舊有 i18n 缺口（如 topbar/notification 相關 spec 與現況不完全同步，屬既有技術債，不在本次處理範圍）。
- **不影響**：既有 `CourseMessage`（課程 FAQ 留言）、既有通知呈現機制（僅新增一個觸發來源，不修改 `notification-inbox` 呈現邏輯本身）。
