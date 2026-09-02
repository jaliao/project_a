# brand-logo Delta（cr-spec-260902-002）

## ADDED Requirements

### Requirement: 共用品牌標記元件

系統 SHALL 提供單一共用的品牌標記元件（`components/layout/brand-logo.tsx` 的 `BrandLogo`），呈現**品牌「A」圖示標記**（沿用 `lib/pwa/brand-icon.tsx` 的 `BrandIconMark`：品牌色 `#2563eb` 圓角方塊＋白色字母「A」）與其右側的**系統名稱文字**（取自 i18n `common.appName`，SHALL NOT 於元件寫死中文）。元件 SHALL 支援：

- `size`（圖示邊長 px，預設 24）；圖示 SHALL 以固定尺寸盒約束，SHALL NOT 撐滿父容器。
- `iconOnly`（僅顯示「A」標記、不顯示文字）。
- 透過 `className` / `textClassName` 由呼叫端調整外距與文字級別。

元件 SHALL 為**純呈現**（不內含連結或按鈕行為）；是否可點、連往何處由各使用點自行包裹。品牌色與「A」字樣 SHALL 與 favicon／PWA 圖示一致（同源 `BrandIconMark`）。

#### Scenario: 顯示「A」標記與系統名

- **WHEN** 任一頁面渲染 `BrandLogo`（未設 `iconOnly`）
- **THEN** 顯示藍底白「A」圓角標記，其右為系統名稱（繁中介面為「啟動事工」）

#### Scenario: 僅圖示模式

- **WHEN** 呼叫端設定 `iconOnly`
- **THEN** 只顯示「A」標記，不顯示文字，圖示尺寸符合傳入的 `size`

#### Scenario: 與 favicon 同源

- **WHEN** 比對 `BrandLogo` 的標記與瀏覽器分頁 favicon／PWA 圖示
- **THEN** 兩者為同一「A」標記與品牌色（皆來自 `BrandIconMark`）

---

### Requirement: 全站品牌標記統一使用共用元件

下列位置 SHALL 一律使用 `BrandLogo` 呈現品牌標記，SHALL NOT 各自內嵌重複的 logo 標記：

- **Topbar**（登入後頁面頂部工具列）：左側品牌區，維持點擊回首頁的既有行為（`BrandLogo` 包在既有的回首頁按鈕內），文字級別維持與原一致（`text-lg`）。
- **公開首頁 `/` 的頁首**：以 `BrandLogo` 取代原內嵌的抽象線條 `<svg>` ＋文字。
- **公開課程介紹頁 `/courses` 的頁首**：以 `BrandLogo` 呈現品牌區。
- **共用 Footer**（見 `site-footer`）：品牌欄。

原本散落於 Topbar 與公開頁頁首的抽象線條 `<svg>` 標記 SHALL 移除。

#### Scenario: Topbar 顯示「A」標記且可回首頁

- **WHEN** 已登入使用者檢視任一頁面的 Topbar
- **THEN** 左上角顯示 `BrandLogo` 的「A」標記＋系統名，點擊後導向使用者首頁（既有 `homeUrl` 行為不變）

#### Scenario: 公開頁頁首顯示「A」標記

- **WHEN** 未登入使用者開啟 `/` 或 `/courses`
- **THEN** 頁首品牌區顯示 `BrandLogo` 的「A」標記＋「啟動事工」，且不再出現舊的抽象線條圖示

#### Scenario: 標記單一來源

- **WHEN** 需要調整品牌標記樣式
- **THEN** 僅需修改 `BrandLogo` / `BrandIconMark`，Topbar、公開頁頁首、Footer 一致更新
