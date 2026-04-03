## ADDED Requirements

### Requirement: 通知 Drawer 標頭按鈕不重疊
通知 Drawer 的標頭區域 SHALL 確保「全部標為已讀」按鈕與 shadcn SheetContent 內建關閉按鈕（X）不發生視覺或點擊範圍重疊。

#### Scenario: 標頭按鈕可正常點擊
- **WHEN** 使用者開啟通知 Drawer
- **THEN** 「全部標為已讀」按鈕與 X 關閉按鈕均可獨立點擊，互不遮擋

#### Scenario: 有未讀通知時全部標為已讀可用
- **WHEN** 使用者開啟通知 Drawer 且有未讀通知
- **THEN** 「全部標為已讀」按鈕為可點擊狀態且不被 X 按鈕覆蓋

#### Scenario: 無未讀通知時按鈕 disabled
- **WHEN** 使用者開啟通知 Drawer 且所有通知已讀
- **THEN** 「全部標為已讀」按鈕為 disabled 狀態
