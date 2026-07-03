# learning-records Delta（cr-spec-260702-006）

## REMOVED Requirements

### Requirement: 學習紀錄頁面
**Reason**: `/learning` 頁面刪除；其內容整併——學習進度與結業資訊移入個人首頁基本資料區塊三卡（student-profile-page），本人課程結業狀態＋回饋面板既已存在於個人首頁（learning-record-feedback），已完成授課於 `/user/{spiritId}/courses` 可查
**Migration**: 刪除 `app/[locale]/(user)/learning/` 整個路由目錄與 `messages/*.json` 之 `learning.*` 命名空間；不設轉導（系統未上線，命中友善 404）

### Requirement: 學習進度摘要
**Reason**: `LevelProgress` 進度摘要由個人首頁基本資料區塊之固定三張課程進度卡取代（含結業時間，較原布林式進度資訊更完整）
**Migration**: 刪除 `components/learning/level-progress.tsx`；進度呈現改見 student-profile-page「基本資料區塊 — 學習進度三卡」

### Requirement: Dashboard 新增學習紀錄入口
**Reason**: `/learning` 已刪除，入口失效；現行 dashboard 實作亦已無此連結（規格早於 dashboard 改版）
**Migration**: 無程式變更需要；dashboard-function-units 規格同步移除 `/learning` 連結描述
