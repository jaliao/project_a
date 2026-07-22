## MODIFIED Requirements

### Requirement: 書籍選購 Dialog
點擊「申請參加」SHALL 彈出書籍選購 Dialog，學員選擇書籍需求後送出申請。

#### Scenario: 開啟書籍選購 Dialog
- **WHEN** 學員點擊「申請參加」
- **THEN** 彈出 Dialog，標題「選擇書籍」，提供四個選項：無須購買、繁體教材、簡體教材、英文教材

#### Scenario: 送出申請
- **WHEN** 學員選擇一項書籍選項後點擊「確認申請」
- **THEN** 系統建立 InviteEnrollment（status=pending, materialChoice=對應值），顯示「申請已送出，等待講師審核」toast，Dialog 關閉

#### Scenario: 未選擇書籍選項
- **WHEN** 學員未選擇任何選項即點擊確認
- **THEN** 顯示「請選擇書籍選項」提示，不送出

#### Scenario: 申請失敗
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示錯誤 toast，Dialog 維持開啟

#### Scenario: 選擇英文教材送出申請
- **WHEN** 學員選擇「英文教材」選項後點擊「確認申請」
- **THEN** 系統建立 InviteEnrollment（status=pending, materialChoice=english），顯示「申請已送出，等待講師審核」toast，Dialog 關閉
