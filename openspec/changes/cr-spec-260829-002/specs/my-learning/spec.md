# my-learning Delta（cr-spec-260829-002）

## MODIFIED Requirements

### Requirement: 首頁「我的學習」入口

「我的學習」入口 SHALL 由 Topbar 提供，而非個人首頁的獨立區塊。Topbar 的操作項目集合 SHALL 包含「我的學習」，桌機（水平按鈕列）與手機（收合選單）皆呈現，點擊 SHALL 導向當前登入使用者的 `/user/{spiritId}/learning`。個人首頁（`/user/{spiritId}`）SHALL NOT 再顯示獨立的「我的學習」區塊（無論本人或他人視角）。

`/user/{spiritId}/learning` 頁本身、其存取守衛（僅本人）、以及書籍子頁的解鎖與撰寫規則不變。

#### Scenario: Topbar 提供我的學習入口

- **WHEN** 已登入使用者檢視任一頁面的 Topbar
- **THEN** Topbar 的操作項目（桌機按鈕列與手機選單）包含「我的學習」，點擊導向 `/user/{spiritId}/learning`（`spiritId` 為當前登入者）

#### Scenario: 個人首頁不再有我的學習區塊

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`
- **THEN** 頁面不顯示獨立的「我的學習」區塊（入口改由 Topbar 提供）

#### Scenario: 他人首頁不顯示我的學習區塊

- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不顯示「我的學習」區塊
