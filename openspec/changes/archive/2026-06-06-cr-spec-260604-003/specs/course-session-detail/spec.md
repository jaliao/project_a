## ADDED Requirements

### Requirement: 講師專屬：公開媒合設定
課程詳情頁 SHALL 讓課程講師（`createdById === 目前使用者`）或管理者切換「公開媒合」開關並編輯／清除「公開招募備註」，透過 Server Action `updateMatchSettings(inviteId, { isPublicMatch, matchNote })`。關閉公開媒合時 SHALL 保留既有 `matchNote`（不清空），僅不再於布告欄顯示。

#### Scenario: 講師開啟公開媒合
- **WHEN** 課程講師於詳情頁開啟「公開媒合」並儲存
- **THEN** `isPublicMatch = true`，課程出現在媒合布告欄

#### Scenario: 講師編輯招募備註
- **WHEN** 課程講師修改招募備註並儲存
- **THEN** `matchNote` 更新為新內容，布告欄卡片顯示新備註

#### Scenario: 關閉公開媒合保留備註
- **WHEN** 課程講師關閉「公開媒合」
- **THEN** `isPublicMatch = false`、課程自布告欄移除，但 `matchNote` 內容保留

#### Scenario: 非講師不可修改
- **WHEN** 非該課程講師且非管理者的使用者呼叫 `updateMatchSettings`
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不變更資料
