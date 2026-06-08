## ADDED Requirements

### Requirement: 公開媒合資料欄位
`CourseInvite` SHALL 新增 `isPublicMatch Boolean`（預設 `false`，是否公開媒合）與 `matchNote String?`（公開招募備註，選填）。`matchNote` 與內部 `notes` 語意分離、並存。

#### Scenario: 預設不公開
- **WHEN** 建立課程未指定公開媒合
- **THEN** `isPublicMatch = false`，課程不出現在媒合布告欄

#### Scenario: 公開並填寫備註
- **WHEN** 建立或更新課程設 `isPublicMatch = true` 並填 `matchNote`
- **THEN** 課程之 `isPublicMatch = true`、`matchNote` 儲存招募備註

### Requirement: 媒合布告欄頁面
系統 SHALL 提供媒合布告欄頁面（`/match-board`），所有登入會員皆可存取，列出「公開且招募中」的課程：`isPublicMatch = true` 且 `cancelledAt IS NULL` 且 `completedAt IS NULL` 且未過邀請截止日（`expiredAt IS NULL` 或 `expiredAt >= 今日`）。課程以既有標準課程卡片呈現並附招募備註，依 `createdAt` 由新到舊排列。

#### Scenario: 顯示公開招募中的課程
- **WHEN** 會員進入媒合布告欄
- **THEN** 頁面以課程卡片列出所有公開、未取消、未結業且未過截止日的課程

#### Scenario: 排除非公開課程
- **WHEN** 某課程 `isPublicMatch = false`
- **THEN** 該課程不出現在布告欄

#### Scenario: 排除已取消／已結業
- **WHEN** 某公開課程 `cancelledAt` 或 `completedAt` 有值
- **THEN** 該課程不出現在布告欄

#### Scenario: 排除已過截止日
- **WHEN** 某公開課程 `expiredAt` 早於今日
- **THEN** 該課程不出現在布告欄

#### Scenario: 布告欄為空
- **WHEN** 目前沒有任何符合條件的公開課程
- **THEN** 頁面顯示「目前沒有公開招募中的課程」提示

#### Scenario: 未登入無法存取
- **WHEN** 未登入者存取 `/match-board`
- **THEN** 被導向 `/login`

### Requirement: 布告欄課程卡片顯示備註與標記
布告欄課程卡片 SHALL 顯示「公開媒合／招募中」標記（badge），並在有 `matchNote` 時顯示招募備註區塊；無備註則不顯示備註區。卡片點擊沿用標準行為，導向該課程詳情頁以供報名。

#### Scenario: 顯示公開媒合標記
- **WHEN** 布告欄渲染某公開課程卡片
- **THEN** 卡片顯示「公開媒合／招募中」badge

#### Scenario: 顯示招募備註
- **WHEN** 該課程 `matchNote` 有內容
- **THEN** 卡片顯示招募備註內容（保留換行）

#### Scenario: 無備註不顯示備註區
- **WHEN** 該課程 `matchNote` 為空
- **THEN** 卡片不顯示備註區塊

#### Scenario: 點擊卡片前往課程詳情
- **WHEN** 會員點擊布告欄上的課程卡片
- **THEN** 導向該課程詳情頁（可於該頁報名）
