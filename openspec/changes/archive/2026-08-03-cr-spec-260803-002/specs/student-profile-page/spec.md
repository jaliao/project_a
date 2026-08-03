## ADDED Requirements

### Requirement: 本人專屬 — 性別補填提示對話框
學員頁面 SHALL 在使用者查閱**自己**的頁面、且 `realName` 與 `phone` 皆已填寫、但 `gender` 仍為 `unspecified` 時，彈出對話視窗詢問性別（男／女）。對話視窗 SHALL 提供關閉／稍後再說的方式，不強制阻擋；只要 `gender` 仍為 `unspecified`，使用者下次造訪首頁 SHALL 再次看到對話視窗。此行為不受 `REQUIRE_PROFILE_COMPLETION` 環境變數影響。

#### Scenario: 已完成首次填寫但性別未填時彈出對話框
- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`，且 `realName`、`phone` 皆已填寫，`gender` 為 `unspecified`
- **THEN** 頁面彈出性別補填對話視窗，提供「男」「女」選擇與送出

#### Scenario: 選擇性別並送出後對話框關閉且不再彈出
- **WHEN** 使用者於對話視窗選擇「男」或「女」並送出
- **THEN** 系統更新 `gender`，對話視窗關閉；之後造訪首頁不再彈出

#### Scenario: 使用者略過對話框
- **WHEN** 使用者點擊關閉／稍後再說
- **THEN** 對話視窗關閉，不寫入任何資料，不記錄略過狀態

#### Scenario: 略過後下次造訪首頁再次彈出
- **WHEN** 使用者曾略過對話視窗，且 `gender` 仍為 `unspecified`，之後再次造訪自己的首頁
- **THEN** 對話視窗再次彈出

#### Scenario: realName 或 phone 未填時不彈出
- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`，且 `realName` 或 `phone` 任一未填（無論 `gender` 是否為 `unspecified`）
- **THEN** 頁面不彈出性別補填對話視窗（此情境由既有資料完整度守衛／Banner 機制處理）

#### Scenario: 性別已填時不彈出
- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`，且 `gender` 非 `unspecified`
- **THEN** 頁面不彈出性別補填對話視窗

#### Scenario: 他人頁面不彈出
- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不彈出性別補填對話視窗
