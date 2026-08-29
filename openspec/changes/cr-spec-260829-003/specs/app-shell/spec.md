# app-shell Delta（cr-spec-260829-003）

## ADDED Requirements

### Requirement: 登入後 app 殼內容區最大寬度

登入後 app 殼的 `(user)` 與 `(admin)` layout SHALL 將 `<main>` 內容區放進一個**最大寬度 1280px、水平置中**的容器。當視窗可用寬度大於 1280px 時，內容 SHALL 置中並在左右兩側留白；當視窗寬度小於或等於 1280px 時，容器 SHALL 佔滿可用寬度，表現與未加此限制時相同。

容器 SHALL 保留水平 gutter（手機約 16px、`sm` 斷點以上約 24px），與此 CR 之前 `(user)` layout 的內距一致；`(admin)` layout 的 `<main>` 亦 SHALL 對齊此內距（手機不再是 24px）。

容器**內部**的頁面內容 SHALL 維持既有的排列方式（靠左），此需求 SHALL NOT 改變任何頁面內元件的對齊、順序或樣式；最大寬度只作用於外層容器。

此需求 SHALL NOT 套用於 `(guest)` layout（登入／註冊等自帶滿版設計的頁），亦 SHALL NOT 套用於 `(user)` layout 中「未登入訪客檢視課程詳情」的精簡分支。

Topbar 的橫條（背景、底線、sticky 定位）SHALL 維持滿版延伸整個視窗寬度，但其**內容列**（Logo 與操作按鈕）SHALL 對齊同一個 1280px 置中容器，使其左右緣與 `<main>` 內容對齊。Footer 的內容 SHALL 同樣對齊此容器。

1280 這個上限值 SHALL 以單一共用常數定義，供 layout、Topbar、Footer 共用，SHALL NOT 在多處各自寫死。

#### Scenario: 寬螢幕內容置中留白

- **WHEN** 已登入使用者在寬度 1920px 的視窗檢視任一 `(user)` 或 `(admin)` 頁面
- **THEN** 主內容區寬度不超過 1280px、水平置中，左右兩側出現留白；內容區內部的資訊仍靠左排列

#### Scenario: 視窗未超過上限時無變化

- **WHEN** 已登入使用者在寬度 1280px 或更窄（含手機、平板、一般筆電）的視窗檢視頁面
- **THEN** 版面表現與加入此上限之前完全相同（內容佔滿扣除 gutter 後的寬度）

#### Scenario: Topbar 與 Footer 對齊內容框

- **WHEN** 已登入使用者在寬度大於 1280px 的視窗檢視頁面
- **THEN** Topbar 的橫條背景與底線仍延伸整個視窗寬，但其中的 Logo 靠內容框左緣、操作按鈕靠內容框右緣；Footer 文字亦落在同一個置中框內

#### Scenario: 後台寬表格仍可捲動

- **WHEN** 管理者在寬螢幕檢視含寬表格的後台頁
- **THEN** 表格在其既有的水平捲動容器內照常捲動，不因 1280px 上限而破版
