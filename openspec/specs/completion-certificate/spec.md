# completion-certificate Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for completion-certificate.

## Requirements

### Requirement: 每個課程等級只顯示一張結業證明
同一課程目錄無論學員參加過幾次，系統 SHALL 只呈現一筆結業資訊，取該目錄最新的 `graduatedAt` 記錄，顯示於學員頁面基本資料區塊的課程進度卡（見 student-profile-page）。

#### Scenario: 同目錄參加多次
- **WHEN** 學員在同一課程目錄的不同課程中均獲得結業
- **THEN** 該目錄之進度卡僅顯示最新一筆 `graduatedAt` 作為學業完成時間

#### Scenario: 不同目錄各自呈現
- **WHEN** 學員擁有啟動靈人與啟動豐盛的結業紀錄
- **THEN** 兩張對應進度卡各自顯示完成樣式與各自的學業完成時間
