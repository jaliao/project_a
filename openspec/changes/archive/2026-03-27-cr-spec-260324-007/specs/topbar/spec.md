## MODIFIED Requirements

### Requirement: 訊息通知按鈕
Topbar SHALL 包含「訊息」圖示按鈕。有未讀訊息時顯示紅色數字 Badge（未讀則數）；無未讀訊息時不顯示 Badge。點擊後開啟右側通知 Drawer（notification-inbox）。

#### Scenario: 無未讀訊息時
- **WHEN** 使用者載入任何頁面且未讀訊息數為 0
- **THEN** 訊息圖示不顯示數字 Badge

#### Scenario: 有未讀訊息時
- **WHEN** 使用者載入任何頁面且有 1 則以上未讀訊息
- **THEN** 訊息圖示右上角顯示紅色數字 Badge，數字為未讀則數

#### Scenario: 點擊訊息按鈕
- **WHEN** 使用者點擊訊息圖示按鈕
- **THEN** 系統從右側滑入通知 Drawer，顯示最新通知列表
