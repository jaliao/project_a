## MODIFIED Requirements

### Requirement: 媒合布告欄頁面
系統 SHALL 提供媒合布告欄頁面（`/match-board`），所有登入會員皆可存取。頁面 SHALL 採頁籤結構，包含「找課程」（預設頁籤）與「找學員」（見 `student-matching-tab` 規格）。「找課程」頁籤列出「公開且招募中」的課程：`isPublicMatch = true` 且 `cancelledAt IS NULL` 且 `completedAt IS NULL` 且未過邀請截止日（`expiredAt IS NULL` 或 `expiredAt >= 今日`）。課程以既有標準課程卡片呈現並附招募備註，依 `createdAt` 由新到舊排列。

#### Scenario: 預設顯示找課程頁籤
- **WHEN** 會員進入媒合布告欄
- **THEN** 頁面預設顯示「找課程」頁籤，以課程卡片列出所有公開、未取消、未結業且未過截止日的課程

#### Scenario: 排除非公開課程
- **WHEN** 某課程 `isPublicMatch = false`
- **THEN** 該課程不出現在「找課程」頁籤

#### Scenario: 排除已取消／已結業
- **WHEN** 某公開課程 `cancelledAt` 或 `completedAt` 有值
- **THEN** 該課程不出現在「找課程」頁籤

#### Scenario: 排除已過截止日
- **WHEN** 某公開課程 `expiredAt` 早於今日
- **THEN** 該課程不出現在「找課程」頁籤

#### Scenario: 找課程頁籤為空
- **WHEN** 目前沒有任何符合條件的公開課程
- **THEN** 「找課程」頁籤顯示「目前沒有公開招募中的課程」提示

#### Scenario: 未登入無法存取
- **WHEN** 未登入者存取 `/match-board`
- **THEN** 被導向 `/login`
