# enrollment-application Delta（cr-spec-260702-005）

## MODIFIED Requirements

### Requirement: 學員申購教材選版本與書本名字
學員申請參加課程並選擇教材版本（繁體／簡體／無須購買）時，若選了需購買的版本，SHALL 同時提供「**教材所屬姓名**」欄位（欄位標籤 SHALL 為「教材所屬姓名」，標示必填），**預設帶入 中文名稱 → 英文名稱 → 匿名**，學員 SHALL 可自行編輯。該欄位為**必填**：送出時若為空白（trim 後），前端 SHALL 阻擋並提示；伺服端 `applyToCourse` SHALL 同步驗證並拒絕（不得自動補預設值）。欄位下方 SHALL 顯示聲明文字：「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」。姓名 SHALL 存於 `InviteEnrollment.materialBookName`（trim、上限 100 字）。選「無須購買」時不需教材所屬姓名。

#### Scenario: 預設帶入教材所屬姓名
- **WHEN** 學員開啟申購並選擇繁體/簡體版本
- **THEN** 教材所屬姓名欄預帶「中文名稱（無則英文名稱，皆無則匿名）」，可編輯

#### Scenario: 自訂教材所屬姓名
- **WHEN** 學員修改教材所屬姓名並送出
- **THEN** `materialBookName` 存為所填值（trim、上限 100 字）

#### Scenario: 空白送出被前端阻擋
- **WHEN** 學員選擇繁體/簡體版本、清空教材所屬姓名後送出
- **THEN** 前端顯示必填提示（toast），不呼叫伺服端

#### Scenario: 伺服端拒絕空白姓名
- **WHEN** `applyToCourse` 收到 `materialChoice ≠ none` 且姓名為空白（未填或 trim 後為空）的請求
- **THEN** 回傳 `{ success: false }` 與必填錯誤訊息，不建立申請記錄，亦不自動補預設值

#### Scenario: 顯示誤植費用聲明
- **WHEN** 學員選擇繁體/簡體版本（教材所屬姓名欄位顯示時）
- **THEN** 欄位下方顯示「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」

#### Scenario: 無須購買不需姓名
- **WHEN** 學員選「無須購買」
- **THEN** 不顯示、也不要求教材所屬姓名
