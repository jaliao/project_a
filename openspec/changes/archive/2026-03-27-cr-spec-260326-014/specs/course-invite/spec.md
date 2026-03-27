## MODIFIED Requirements

### Requirement: 複製課程連結
建立邀請成功後，系統 SHALL 顯示課程頁面連結（`/course/{id}`）並提供「分享」按鈕；點擊時優先使用 Web Share API 進行系統原生分享，若瀏覽器不支援則 fallback 為複製連結至剪貼簿並顯示「已複製」提示。

#### Scenario: 支援 Web Share API 的環境（手機瀏覽器）
- **WHEN** 教師點擊「分享」按鈕，且 `navigator.share` 可用
- **THEN** 系統呼叫 Web Share API 開啟原生分享面板，分享標題與課程 URL

#### Scenario: 不支援 Web Share API 的環境（桌機瀏覽器）
- **WHEN** 教師點擊「分享」按鈕，且 `navigator.share` 不可用
- **THEN** 系統將課程連結複製至剪貼簿，按鈕短暫顯示「已複製！」
