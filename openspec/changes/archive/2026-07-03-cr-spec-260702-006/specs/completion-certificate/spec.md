# completion-certificate Delta（cr-spec-260702-006）

## MODIFIED Requirements

### Requirement: 每個課程等級只顯示一張結業證明
同一課程目錄無論學員參加過幾次，系統 SHALL 只呈現一筆結業資訊，取該目錄最新的 `graduatedAt` 記錄，顯示於學員頁面基本資料區塊的課程進度卡（見 student-profile-page）。

#### Scenario: 同目錄參加多次
- **WHEN** 學員在同一課程目錄的不同課程中均獲得結業
- **THEN** 該目錄之進度卡僅顯示最新一筆 `graduatedAt` 作為學業完成時間

#### Scenario: 不同目錄各自呈現
- **WHEN** 學員擁有啟動靈人與啟動豐盛的結業紀錄
- **THEN** 兩張對應進度卡各自顯示完成樣式與各自的學業完成時間

## REMOVED Requirements

### Requirement: 結業證明卡片
**Reason**: 獨立結業證明卡片元件（`CompletionCertificateCard`）刪除，結業資訊改由基本資料區塊固定三張課程進度卡承載（cr-spec-260702-006）
**Migration**: 刪除 `components/course-invite/completion-certificate-card.tsx`；結業日期顯示改見 student-profile-page「基本資料區塊 — 學習進度三卡」

### Requirement: 學員頁面顯示結業證明
**Reason**: 學員頁面獨立「結業證明」區塊移除，與學習進度合併為基本資料區塊內固定三卡
**Migration**: 刪除 `/user/[spiritId]` 頁面之結業證明區塊；資料來源 `getMyCompletionCertificates` 續用於進度卡
