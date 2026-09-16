## MODIFIED Requirements

### Requirement: 書籍選購 Dialog
點擊「申請參加」SHALL 彈出書籍選購 Dialog，學員選擇書籍需求後送出申請。Dialog 開啟時 SHALL 依該學員是否曾於任一課程有 `status=approved` 之報名記錄，預先選取對應選項：曾上過課 SHALL 預選「已有教材」，從未上過課（新生）SHALL 預選「繁體教材」；學員送出前仍可自由改選其他選項。選項顯示順序 SHALL 為「繁體教材、簡體教材、英文教材、已有教材」。

#### Scenario: 開啟書籍選購 Dialog（新生）
- **WHEN** 從未上過課的學員點擊「申請參加」
- **THEN** 彈出 Dialog，標題「選擇書籍」，依序顯示「繁體教材、簡體教材、英文教材、已有教材」四個選項，且「繁體教材」為預先選取狀態

#### Scenario: 開啟書籍選購 Dialog（曾上過課）
- **WHEN** 曾上過任一課程（曾有 `status=approved` 報名記錄）的學員點擊「申請參加」
- **THEN** 彈出 Dialog，選項顯示順序同上，且「已有教材」為預先選取狀態

#### Scenario: 送出申請
- **WHEN** 學員選擇一項書籍選項後點擊「確認申請」
- **THEN** 系統建立 InviteEnrollment（status=pending, materialChoice=對應值），顯示「申請已送出，等待講師審核」toast，Dialog 關閉

#### Scenario: 未選擇書籍選項
- **WHEN** 送出時 Dialog 內部狀態為未選擇任一選項（正常操作流程下因一律有預選值不會發生，僅作為程式防禦性檢查）
- **THEN** 顯示「請選擇書籍選項」提示，不送出

#### Scenario: 申請失敗
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示錯誤 toast，Dialog 維持開啟

#### Scenario: 改選其他選項送出申請
- **WHEN** 學員將預選項目改選為其他選項（例如「英文教材」）後點擊「確認申請」
- **THEN** 系統建立 InviteEnrollment（status=pending, materialChoice=改選後的值），顯示「申請已送出，等待講師審核」toast，Dialog 關閉
