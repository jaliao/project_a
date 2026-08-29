# topbar Delta（cr-spec-260829-003）

## MODIFIED Requirements

### Requirement: Topbar 共用元件
`(user)` layout SHALL 在所有已登入頁面頂部渲染 Topbar 元件，包含：系統標題、右側操作按鈕群組。

Topbar 的 `<header>` 橫條（背景、底線、`sticky` 定位）SHALL 延伸整個視窗寬度；其**內容列**（品牌／Logo 與右側操作項目）SHALL 對齊 app 殼的最大寬度容器（1280px、水平置中，見 `app-shell`），使 Logo 靠內容框左緣、操作按鈕靠內容框右緣，與 `<main>` 內容左右對齊。內容列的水平內距 SHALL 與 `<main>` 的 gutter 一致（手機約 16px、`sm` 以上約 24px）。

#### Scenario: 已登入頁面顯示 Topbar
- **WHEN** 已登入使用者存取任何 `(user)` 路由下的頁面
- **THEN** 頁面頂部顯示 Topbar

#### Scenario: 寬螢幕 Topbar 內容對齊內容框
- **WHEN** 已登入使用者在寬度大於 1280px 的視窗檢視 Topbar
- **THEN** `<header>` 的背景與底線仍滿版，但 Logo 與操作按鈕對齊 1280px 置中容器的左右緣（與主內容區對齊）
