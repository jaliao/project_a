# course-session-card Delta（cr-spec-260714-003）

## MODIFIED Requirements

### Requirement: 課程卡片元件
系統 SHALL 提供共用 `CourseSessionCard` 元件，接受課程資料 props 並以卡片方式呈現，供 Dashboard 與開課查詢頁共用。卡片 SHALL 接受**必要的 `inviteId` prop**（課程編號）與可選的 `href` prop，當 `href` 有值時整張卡片為可點擊連結。
卡片標題區 SHALL 為垂直堆疊：**課程編號（`#255` 樣式，等寬字體、淡色）與**課程標籤列（公開招生／等級／狀態）位於課程標題**上方**（編號在標籤列最前），標題獨占一行、不因標籤佔位而折行（過長時自然換行完整顯示）。所有卡片使用處 SHALL 一律顯示課程編號（含學員視角）。

#### Scenario: 顯示基本課程資訊
- **WHEN** 元件收到 inviteId、title、courseLevel、maxCount、enrolledCount
- **THEN** 卡片顯示課程編號（`#編號`）、課程名稱、課程等級標籤、已報名人數 / 預計人數

#### Scenario: 編號顯示於標題上方
- **WHEN** 任一頁面（開課管理、我的開課、媒合布告欄、學員課程列表等）渲染課程卡片
- **THEN** 課程編號以 `#編號` 樣式顯示於標籤列最前、課程標題上方

#### Scenario: 標籤列於標題上方、標題不折行
- **WHEN** 卡片於手機視窗顯示且標題較長
- **THEN** 編號與標籤列顯示於標題上方，標題獨占整行自然換行，不與標籤同列擠壓
