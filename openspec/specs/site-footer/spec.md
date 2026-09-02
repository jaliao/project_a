# site-footer Specification

## Purpose
TBD - created by archiving change cr-spec-260902-002. Update Purpose after archive.
## Requirements
### Requirement: 共用多欄 Footer 元件

系統 SHALL 提供單一共用 Footer 元件（`components/layout/footer.tsx` 的 `Footer`），採多欄版面（參考 shadcnblocks footer2），包含：

- **品牌欄**：`BrandLogo`（見 `brand-logo`）＋一段簡短系統描述文字（i18n `footer.description`）。
- **連結區塊**：2–3 個分類，每類一個標題（i18n）與數個連結；連結 SHALL 僅指向站內公開可達路由，SHALL NOT 包含社群媒體連結或圖示。
- **底部列**：見「Footer 底部列」需求。

Footer 內容 SHALL 對齊 app 殼的 1280px 置中容器（沿用 `APP_MAX_WIDTH` 共用常數，與 `app-shell` 一致），並 SHALL 響應式呈現（窄螢幕品牌欄佔滿、連結區塊堆疊；寬螢幕多欄並排）。所有文字 SHALL 取自 i18n `footer` 命名空間，SHALL NOT 於元件寫死中文。站內連結 SHALL 使用 locale 感知的 `Link`（`@/i18n/navigation`）。

#### Scenario: 多欄版面呈現

- **WHEN** 使用者在寬螢幕檢視任一含 Footer 的頁面
- **THEN** Footer 以多欄呈現：品牌欄（標記＋系統名＋描述）與各連結區塊並排，內容左右緣對齊主內容的 1280px 容器

#### Scenario: 窄螢幕堆疊

- **WHEN** 使用者在手機寬度檢視 Footer
- **THEN** 品牌欄佔滿寬度、連結區塊堆疊，內容不溢出容器

#### Scenario: 無社群連結

- **WHEN** 檢視 Footer 任一區塊
- **THEN** 不出現 Facebook／Instagram／X／LinkedIn 等社群媒體連結或圖示

---

### Requirement: Footer 選單內容（草擬版）

Footer 的連結區塊 SHALL 至少涵蓋下列站內公開路由（分類標題與連結文字為 i18n key，內容為本次草擬版，日後可於單一設定處調整）：

- **「探索」**：首頁（`/`）、課程介紹（`/courses`）、安裝 App（`/pwa-install`）。
- **「條款與隱私」**：服務條款（`/terms`）、隱私政策（`/privacy`）。

每個連結 SHALL 導向對應的既有公開路由；SHALL NOT 產生無效連結（`#` 佔位）。

#### Scenario: 點擊 Footer 連結導向對應頁

- **WHEN** 使用者點擊 Footer「課程介紹」連結
- **THEN** 導向 `/courses`（locale 感知）

#### Scenario: 無佔位連結

- **WHEN** 檢視 Footer 所有連結
- **THEN** 每個連結都有實際 `href` 指向既有路由，無 `#` 佔位連結

---

### Requirement: Footer 底部列（版權／法律連結／版本號同列）

Footer SHALL 於連結區塊下方以一條分隔線後的**底部列**呈現：

- **版權**：`© {當前年份} 啟動事工`（i18n `footer.copyright`，年份為伺服器當前年份，SHALL NOT 寫死）。
- **法律連結**：服務條款（`/terms`）、隱私政策（`/privacy`）。
- **版本資訊**：`v{version} · {updatedAt}`（見 `footer-version-info`），與版權、法律連結**同一列**呈現（寬螢幕橫向排列、窄螢幕可換行堆疊），SHALL NOT 另立獨立一行區塊。

#### Scenario: 底部列三段內容同列

- **WHEN** 使用者在寬螢幕檢視 Footer 底部列
- **THEN** 同一列同時看到「© {年份} 啟動事工」、法律連結、以及 `v{版本號} · {更新日期}`

#### Scenario: 版權年份為當前年

- **WHEN** 系統時間進入新的一年後使用者檢視 Footer
- **THEN** 版權年份顯示為當前年份，無需改碼

---

### Requirement: Footer 出現範圍

共用 Footer SHALL 出現於下列頁面：

- **登入後**：所有 `(user)` 與 `(admin)` route group 頁面（由該兩個 layout 於 `<main>` 之後渲染，維持既有位置）。
- **登入前**：僅公開行銷頁——首頁 `/`、公開課程介紹 `/courses`、服務條款 `/terms`、隱私政策 `/privacy`。

共用 Footer SHALL NOT 出現於登入／註冊／找回帳號／重設密碼／忘記密碼／onboarding／變更密碼／帳號停用／PWA 安裝說明等頁面。原本內嵌於公開首頁與公開課程頁的臨時 `<footer>` SHALL 由共用 Footer 取代（功能不減：首頁／課程／安裝 App／服務條款／隱私政策連結皆保留於共用 Footer）。共用 Footer SHALL NOT 加入 `(guest)` route group 的共用 layout（避免套用到表單類免登入頁）。

#### Scenario: 公開行銷頁顯示共用 Footer

- **WHEN** 未登入使用者開啟 `/`、`/courses`、`/terms` 或 `/privacy`
- **THEN** 頁面底部顯示共用多欄 Footer（含版本資訊底部列）

#### Scenario: 表單類免登入頁不顯示 Footer

- **WHEN** 未登入使用者開啟登入頁或註冊頁
- **THEN** 頁面不顯示共用 Footer

#### Scenario: 登入後頁面顯示共用 Footer

- **WHEN** 已登入使用者開啟任一使用者端或後台頁面
- **THEN** 頁面底部顯示同一個共用多欄 Footer（取代原僅顯示版本號的精簡 Footer）

