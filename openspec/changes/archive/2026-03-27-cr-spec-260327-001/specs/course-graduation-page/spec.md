## ADDED Requirements

### Requirement: 結業表單頁面入口
系統 SHALL 提供 `/course/[id]/graduate` 頁面，僅課程建立者（講師）可存取。

#### Scenario: 講師進入結業頁面
- **WHEN** 課程建立者存取 `/course/[id]/graduate`
- **THEN** 系統顯示結業表單，頁面包含「填寫」步驟

#### Scenario: 非講師存取結業頁面
- **WHEN** 非課程建立者存取 `/course/[id]/graduate`
- **THEN** 系統顯示「無權限」並導回課程詳情頁

#### Scenario: 課程已結業時存取
- **WHEN** 課程 `completedAt` 已有值時存取 `/course/[id]/graduate`
- **THEN** 系統顯示「課程已結業」並導回課程詳情頁

### Requirement: 填寫步驟 — 最後一堂課程日期
結業表單 SHALL 包含「最後一堂課程日期」欄位（date picker 或 date input），為必填欄位。

#### Scenario: 未填日期即進入預覽
- **WHEN** 講師未填寫最後一堂課程日期，點擊「下一步」
- **THEN** 系統顯示欄位錯誤提示，不進入預覽步驟

#### Scenario: 填寫有效日期
- **WHEN** 講師填寫有效日期並點擊「下一步」
- **THEN** 系統進入預覽步驟

### Requirement: 填寫步驟 — 學員結業狀態
結業表單 SHALL 列出所有 `status = approved` 的學員，每位學員預設為「已結業」狀態（checkbox 預選）。

#### Scenario: 預設全員結業
- **WHEN** 講師進入填寫步驟
- **THEN** 所有已審核通過學員的結業 checkbox 預設為勾選

#### Scenario: 取消勾選學員 — 顯示未結業原因
- **WHEN** 講師取消勾選某位學員的結業 checkbox
- **THEN** 該學員列下方出現「未結業原因」下拉選單

#### Scenario: 未填未結業原因即進入預覽
- **WHEN** 某位學員被取消結業勾選，但未選擇未結業原因，講師點擊「下一步」
- **THEN** 系統顯示錯誤提示「請填寫未結業原因」，不進入預覽步驟

### Requirement: 未結業原因下拉選單選項
未結業原因下拉選單 SHALL 提供以下選項：
- `時間不足`
- `其他`

#### Scenario: 選擇未結業原因
- **WHEN** 講師展開未結業原因下拉選單
- **THEN** 選單顯示「時間不足」與「其他」兩個選項

### Requirement: 預覽步驟
填寫完成後，系統 SHALL 顯示預覽頁面，呈現本次結業的完整摘要。

#### Scenario: 預覽頁面內容
- **WHEN** 講師完成填寫並進入預覽步驟
- **THEN** 頁面顯示：最後一堂課程日期、已結業學員名單、未結業學員名單（含原因）

#### Scenario: 返回修改
- **WHEN** 講師在預覽步驟點擊「返回修改」
- **THEN** 系統回到填寫步驟，並保留原有填寫內容

### Requirement: 送出結業
預覽確認後，講師 SHALL 可點擊「確認送出」提交結業結果。

#### Scenario: 成功送出結業
- **WHEN** 講師在預覽步驟點擊「確認送出」
- **THEN** 系統執行結業操作並顯示成功提示，導回課程詳情頁

#### Scenario: 送出中禁用按鈕
- **WHEN** 結業送出請求進行中
- **THEN** 「確認送出」按鈕顯示「處理中...」並禁用，防止重複送出
