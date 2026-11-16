## MODIFIED Requirements

### Requirement: 同班／好友唯讀查看他人筆記

系統 SHALL 依下列規則判定查看者（viewer）是否可唯讀查看某學員（author）在某課程目錄（`courseCatalogId`）下的分段式查經筆記，四條件之一成立即視為可見：

1. **本人**：viewer 與 author 為同一帳號。
2. **好友**：viewer 已將 author 加入好友清單（`Friendship`，`ownerId = viewer`、`friendId = author`，單向，不需 author 同意或互加）。符合此條件時，author**已解鎖**的全部課程目錄皆對 viewer 可見，不限特定課程目錄。
3. **同班**：author 在該課程目錄下存在至少一筆 `status = approved`、所屬開課未取消且 `startedAt` 已設定的報名（`InviteEnrollment`），且 viewer 在**同一次開課**（相同 `inviteId`）下也存在 `status = approved`、該開課未取消的報名。
4. **講師**：viewer 在某一次開課（`CourseInvite`）下存在 `status = approved`、該開課未取消的報名，且該開課的 `createdById` 等於 author（即 author 是該堂課的講師），且該開課對應的課程目錄在 author**已解鎖**的課程目錄集合內。符合此條件時，僅該開課對應的**單一課程目錄**對 viewer 可見（範圍比照「同班」，不擴大到 author 的其他已解鎖課程目錄）。

不符合以上任一條件者，該課程目錄對 viewer SHALL NOT 可見。

此可見性判定 SHALL 為即時查詢（依當前 `InviteEnrollment`／`Friendship` 狀態計算），SHALL NOT 以快照方式記錄於筆記本身；好友關係解除或報名狀態變動後，下一次查詢 SHALL 反映最新結果。

若 author 在同一課程目錄下存在多筆 `approved` 報名（對應不同次開課），任一次開課的同學皆視為對該課程目錄「同班」可見，SHALL NOT 區分到特定梯次。

「講師」條件為**單向**：僅 viewer（學生）可唯讀查看 author（講師）的筆記；author SHALL NOT 因此自動可見 viewer 的筆記（除非 author 另外也符合同班或好友條件，或自行將 viewer 加為好友）。

可見的課程目錄下，viewer SHALL 僅能唯讀檢視 author 已填寫的筆記內容（總標題、次標題、所領受的話語、運用），SHALL NOT 看到任何新增或編輯表單、SHALL NOT 能呼叫 `createStudyEntry`／`updateStudyEntry` 修改 author 的筆記。author 本人仍為該筆記唯一可編輯／刪除者（既有擁有者驗證不變；學員端仍 SHALL NOT 提供刪除入口）。

本功能 SHALL NOT 提供任何個人隱私「設為不公開」開關；author SHALL NOT 能將自己的筆記排除於本規則之外。

#### Scenario: 好友可見全部已解鎖課程目錄

- **WHEN** viewer 已將 author 加入好友清單，author 已解鎖「啟動靈人」與「啟動豐盛」兩個課程目錄
- **THEN** viewer 對這兩個課程目錄的 author 筆記皆可唯讀查看

#### Scenario: 單向好友不互惠

- **WHEN** viewer 已將 author 加入好友清單，但 author 未將 viewer 加入好友清單
- **THEN** viewer 可唯讀查看 author 的筆記；author SHALL NOT 因此自動可見 viewer 的筆記（除非 author 另外也符合同班條件或自行將 viewer 加為好友）

#### Scenario: 同班可見

- **WHEN** author 與 viewer 在同一次開課（同一 `inviteId`）下皆為 `status = approved`、該開課未取消的報名
- **THEN** viewer 對該開課對應課程目錄的 author 筆記可唯讀查看

#### Scenario: 講師可見（僅該堂課對應課程目錄）

- **WHEN** viewer 在 author 擔任講師的某一次開課（`CourseInvite.createdById = author`）下為 `status = approved`、該開課未取消的報名，且該開課對應的課程目錄在 author 已解鎖的課程目錄集合內
- **THEN** viewer 可唯讀查看 author 在該課程目錄下的筆記；若 author 另外在其他課程目錄也有筆記，但該堂課不是教那個目錄，viewer SHALL NOT 因此可見 author 其他課程目錄的筆記

#### Scenario: 講師條件不互惠

- **WHEN** viewer 依「講師」條件可唯讀查看 author（講師）的筆記
- **THEN** author SHALL NOT 因此自動可見 viewer 的筆記（除非另外符合同班、好友條件，或 author 自行將 viewer 加為好友）

#### Scenario: 講師本身未解鎖該課程目錄時不可見

- **WHEN** viewer 在 author 擔任講師的某一次開課下為 approved 報名，但該開課對應的課程目錄不在 author 已解鎖的課程目錄集合內
- **THEN** viewer 對該課程目錄的 author 筆記不可見（因 author 於該目錄本身無筆記內容可顯示）

#### Scenario: 非同班非好友非其講師不可見

- **WHEN** viewer 與 author 並非好友、兩人在 author 已解鎖的所有課程目錄下皆無共同的 `inviteId` 報名，且 author 也不是 viewer 任何已核准開課的講師
- **THEN** viewer 對 author 的所有課程目錄筆記皆不可見

#### Scenario: 同一課程目錄上過兩梯時兩梯同學皆可見

- **WHEN** author 在「啟動靈人」有兩筆 `approved` 報名，分屬開課 A 與開課 B；viewer 在開課 B 亦為 `approved` 報名
- **THEN** viewer 可唯讀查看 author 在「啟動靈人」下的全部筆記（含對應開課 A 撰寫的筆記），不限定僅開課 B 期間的筆記

#### Scenario: 唯讀視角不可編輯或刪除

- **WHEN** viewer 以同班、好友或講師關係唯讀查看 author 的筆記
- **THEN** 畫面不顯示任何新增、編輯或刪除按鈕；viewer 若直接呼叫 `updateStudyEntry` 修改該筆記，系統依既有擁有者驗證回傳無權限錯誤，不異動資料

#### Scenario: 好友關係解除後即時失去好友可見性

- **WHEN** viewer 原本已將 author 加入好友清單並可唯讀查看其筆記，之後 viewer 將 author 從好友清單移除，且兩人無同班或講師關係
- **THEN** 下一次查詢起，viewer 對 author 的筆記不再可見
