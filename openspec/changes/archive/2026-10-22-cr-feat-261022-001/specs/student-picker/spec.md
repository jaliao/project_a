## ADDED Requirements

### Requirement: 候選人代填學員標示

`StudentPicker` 的好友清單與搜尋結果候選卡片，SHALL 於候選人 `isProxyMember` 為 `true` 時顯示「未註冊」徽章。此標示純為顯示用途，SHALL NOT 影響候選人是否可被選取、不改變既有排序規則（好友優先）。

#### Scenario: 搜尋結果中代填學員顯示徽章
- **WHEN** 搜尋結果包含一位 `isProxyMember = true` 的候選人
- **THEN** 該候選卡片顯示「未註冊」徽章，仍可被點選回傳

#### Scenario: 好友清單中代填學員顯示徽章
- **WHEN** 操作者的好友清單包含一位 `isProxyMember = true` 的好友
- **THEN** 該候選卡片顯示「未註冊」徽章

#### Scenario: 一般會員不顯示徽章
- **WHEN** 候選人 `isProxyMember` 為 `false`
- **THEN** 不顯示「未註冊」徽章
