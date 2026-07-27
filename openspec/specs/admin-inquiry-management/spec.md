# admin-inquiry-management Specification

## Purpose
TBD - created by archiving change cr-spec-260722-002. Update Purpose after archive.

## Requirements

### Requirement: 後台提問管理列表
後台 SHALL 提供「提問管理」頁面，以分頁籤（待處理／已回覆／全部）呈現學員提問，以卡片形式逐筆呈現：分類、提問人顯示名稱（真實姓名）、提問人性別、提問人所屬單位、內容摘要、狀態 Badge、提問時間；若提問關聯特定課程，顯示該課程名稱。提問人帳號已被刪除時，卡片 SHALL 改以該筆提問建立時寫入的文字快照顯示提問人資訊，並額外顯示「此帳號已被刪除」提示。

#### Scenario: 檢視待處理分頁
- **WHEN** 管理者開啟提問管理頁面並選擇「待處理」分頁
- **THEN** 僅列出 `status = pending` 的提問卡片，依提問時間排序

#### Scenario: 檢視全部分頁
- **WHEN** 管理者選擇「全部」分頁
- **THEN** 列出所有提問卡片，不限狀態

#### Scenario: 列表為空
- **WHEN** 某分頁下無任何提問
- **THEN** 顯示對應空狀態提示

#### Scenario: 卡片顯示提問人背景資訊
- **WHEN** 管理者檢視任一提問卡片，且提問人帳號仍存在
- **THEN** 卡片顯示提問人的顯示名稱、真實姓名、性別、所屬單位

#### Scenario: 提問人帳號已刪除時以快照顯示並加註提示
- **WHEN** 管理者檢視某提問卡片，且該筆提問的提問人帳號已被刪除（`userId` 為 `null`）
- **THEN** 卡片改以建立當下寫入的文字快照顯示提問人顯示名稱、真實姓名、性別、所屬單位，並顯示「此帳號已被刪除」提示

#### Scenario: 卡片顯示課程關聯
- **WHEN** 某筆提問的 `courseInviteId` 有值
- **THEN** 卡片顯示該課程名稱

### Requirement: 展開提問詳情並回覆
管理者 SHALL 能展開任一筆提問卡片查看完整內容，並填寫回覆內容送出；送出後該筆提問狀態轉為已回覆，記錄回覆管理者與回覆時間。

#### Scenario: 首次回覆提問
- **WHEN** 管理者展開一筆待處理提問卡片，填寫回覆內容並送出
- **THEN** 系統寫入 `replyBody`／`repliedById`／`repliedAt`，`status` 更新為 `replied`，列表刷新

#### Scenario: 重新回覆已回覆提問
- **WHEN** 管理者對已回覆的提問再次填寫並送出新回覆
- **THEN** 系統覆寫既有 `replyBody`／`repliedById`／`repliedAt` 為最新內容，狀態維持 `replied`

#### Scenario: 回覆表單預帶入既有回覆內容
- **WHEN** 管理者展開已回覆提問卡片的回覆表單
- **THEN** 表單預設值為目前 `replyBody`，避免從空白重寫覆蓋既有內容

#### Scenario: 回覆後通知學員
- **WHEN** 管理者成功送出回覆
- **THEN** 系統呼叫既有通知機制為提問學員建立一則通知

### Requirement: 重新標記待處理
管理者 SHALL 能將已回覆的提問重新標記為待處理，既有回覆內容 SHALL NOT 被清空；此操作於提問管理列表與會員詳情頁提問分頁皆可執行。

#### Scenario: 重新標記待處理
- **WHEN** 管理者對一筆已回覆提問卡片點擊「重新標記待處理」
- **THEN** `status` 更新為 `pending`，`replyBody`／`repliedById`／`repliedAt` 維持原值不變

### Requirement: 提問卡片查看更多資訊連結
後台提問卡片 SHALL 提供「查看會員」連結（另開分頁至該會員之後台會員詳情頁），若提問關聯特定課程，SHALL 另提供「查看課程」連結（另開分頁至該課程詳情頁）。提問人帳號已被刪除時（`userId` 為 `null`），卡片 SHALL NOT 顯示「查看會員」連結。

#### Scenario: 點擊查看會員連結
- **WHEN** 管理者點擊提問卡片的「查看會員」連結
- **THEN** 另開分頁導向 `/admin/members/{userId}`

#### Scenario: 點擊查看課程連結
- **WHEN** 管理者點擊有課程關聯之提問卡片的「查看課程」連結
- **THEN** 另開分頁導向 `/course/{courseInviteId}`

#### Scenario: 無課程關聯時不顯示查看課程連結
- **WHEN** 提問的 `courseInviteId` 為 `null`
- **THEN** 卡片不顯示「查看課程」連結

#### Scenario: 提問人帳號已刪除時不顯示查看會員連結
- **WHEN** 管理者檢視某提問卡片，且該筆提問的提問人帳號已被刪除（`userId` 為 `null`）
- **THEN** 卡片不顯示「查看會員」連結

### Requirement: 會員詳情頁提問分頁
後台會員詳情頁 SHALL 新增「會員提問」分頁，顯示該會員送出過的全部提問，與提問管理列表使用相同的提問卡片元件呈現。

#### Scenario: 檢視會員提問分頁
- **WHEN** 管理者於會員詳情頁切換至「會員提問」分頁
- **THEN** 顯示該會員的全部提問，呈現格式與「提問管理」頁面卡片一致

#### Scenario: 會員無提問時的空狀態
- **WHEN** 該會員尚未送出過任何提問
- **THEN** 「會員提問」分頁顯示空狀態提示
