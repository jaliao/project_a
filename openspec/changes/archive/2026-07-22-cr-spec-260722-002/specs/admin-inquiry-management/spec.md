## ADDED Requirements

### Requirement: 後台提問管理列表
後台 SHALL 提供「提問管理」頁面，以分頁籤（待處理／已回覆／全部）呈現學員提問列表，每筆顯示：分類、提問人、內容摘要、狀態 Badge、提問時間。

#### Scenario: 檢視待處理分頁
- **WHEN** 管理者開啟提問管理頁面並選擇「待處理」分頁
- **THEN** 僅列出 `status = pending` 的提問，依提問時間排序

#### Scenario: 檢視全部分頁
- **WHEN** 管理者選擇「全部」分頁
- **THEN** 列出所有提問，不限狀態

#### Scenario: 列表為空
- **WHEN** 某分頁下無任何提問
- **THEN** 顯示對應空狀態提示

### Requirement: 展開提問詳情並回覆
管理者 SHALL 能展開任一筆提問查看完整內容，並填寫回覆內容送出；送出後該筆提問狀態轉為已回覆，記錄回覆管理者與回覆時間。

#### Scenario: 首次回覆提問
- **WHEN** 管理者展開一筆待處理提問，填寫回覆內容並送出
- **THEN** 系統寫入 `replyBody`／`repliedById`／`repliedAt`，`status` 更新為 `replied`，列表刷新

#### Scenario: 重新回覆已回覆提問
- **WHEN** 管理者對已回覆的提問再次填寫並送出新回覆
- **THEN** 系統覆寫既有 `replyBody`／`repliedById`／`repliedAt` 為最新內容，狀態維持 `replied`

#### Scenario: 回覆表單預帶入既有回覆內容
- **WHEN** 管理者展開已回覆提問的回覆表單
- **THEN** 表單預設值為目前 `replyBody`，避免從空白重寫覆蓋既有內容

#### Scenario: 回覆後通知學員
- **WHEN** 管理者成功送出回覆
- **THEN** 系統呼叫既有通知機制為提問學員建立一則通知

### Requirement: 重新標記待處理
管理者 SHALL 能將已回覆的提問重新標記為待處理，既有回覆內容 SHALL NOT 被清空。

#### Scenario: 重新標記待處理
- **WHEN** 管理者對一筆已回覆提問點擊「重新標記待處理」
- **THEN** `status` 更新為 `pending`，`replyBody`／`repliedById`／`repliedAt` 維持原值不變
