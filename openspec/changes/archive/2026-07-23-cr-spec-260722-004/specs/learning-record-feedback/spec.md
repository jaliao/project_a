## REMOVED Requirements

### Requirement: 學習歷程回饋入口
**Reason**: 回饋歷程功能整體收掉，統一改用「聯繫管理者」（`contact-admin`）作為學員提問/回報入口，避免入口分散。
**Migration**: 學員如需反映遺失學習歷程等問題，改至「我的提問」頁面（`/user/{spiritId}/inquiries`）送出提問（分類可選「課程問題」）。

### Requirement: 送出學習歷程回饋
**Reason**: 同上——`LearningFeedback` 送出機制由 `SupportInquiry` 提問流程取代。
**Migration**: 改用既有 `contact-admin` 提問表單送出，不再建立 `LearningFeedback` 記錄。

### Requirement: 本人可見課程結業狀態與一鍵回報
**Reason**: 一鍵回報入口與回饋表單耦合，回饋表單移除後此入口一併下架；個人頁「學習紀錄」區塊改為顯示最近提問（見 `contact-admin` 新增需求）。
**Migration**: 學員如認為結業狀態有誤，改用「聯繫管理者」提問反映，無自動預帶課程/老師機制。

### Requirement: 查看自己的回饋狀態
**Reason**: 回饋狀態清單由「我的提問」清單（`contact-admin`，已支援待處理／已回覆狀態顯示）取代。
**Migration**: 學員至 `/user/{spiritId}/inquiries` 查看所有提問與回覆狀態；`LearningFeedback` 既有歷史資料保留於資料庫但不再提供前台查詢介面。
