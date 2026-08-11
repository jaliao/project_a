## ADDED Requirements

### Requirement: 推播通知開關
通知 Drawer 頂部 SHALL 提供「啟用推播通知」開關，反映目前瀏覽器／裝置是否已訂閱推播；點擊開關時才觸發瀏覽器通知權限請求與訂閱／取消訂閱動作，不於頁面載入時主動請求權限。

#### Scenario: 目前裝置尚未訂閱
- **WHEN** 使用者開啟通知 Drawer，且目前瀏覽器／裝置尚無 `PushSubscription` 記錄
- **THEN** 開關顯示為關閉狀態

#### Scenario: 目前裝置已訂閱
- **WHEN** 使用者開啟通知 Drawer，且目前瀏覽器／裝置已有對應 `PushSubscription` 記錄
- **THEN** 開關顯示為開啟狀態

#### Scenario: 點擊開關啟用推播
- **WHEN** 使用者點擊處於關閉狀態的開關
- **THEN** 系統請求瀏覽器通知權限，取得同意後訂閱推播並將開關切換為開啟狀態

#### Scenario: 點擊開關停用推播
- **WHEN** 使用者點擊處於開啟狀態的開關
- **THEN** 系統取消目前裝置的推播訂閱，並將開關切換為關閉狀態
