## MODIFIED Requirements

### Requirement: 我的學習頁面路由與存取

系統 SHALL 提供 `/user/{spiritId}/learning`（書籍選擇）與 `/user/{spiritId}/learning/{catalogId}`（單一課程目錄）兩層路由，顯示該學員的「分段式查經」筆記。

本人存取自己的路由 SHALL 維持可寫入視角（含既有大綱合法性與解鎖判斷，不因本次異動而放寬）。

非本人（已登入）存取他人的路由時，依「同班／好友唯讀查看他人筆記」Requirement 判定可見性：

- `/user/{spiritId}/learning`：若查看者對該學員**至少一個**課程目錄可見，系統 SHALL 以唯讀模式顯示該學員的書籍選擇頁（僅列出可見的課程目錄）；若**沒有任何**課程目錄可見，系統 SHALL 重定向至查看者本人的 `/user/{selfSpiritId}/learning`。
- `/user/{spiritId}/learning/{catalogId}`：若該 `{catalogId}` 對查看者可見，系統 SHALL 以唯讀模式顯示該學員在該課程目錄下的課次與已填寫筆記；若不可見，系統 SHALL 重定向至查看者本人同一 `{catalogId}` 的 `/user/{selfSpiritId}/learning/{catalogId}`。

未登入使用者存取任一層路由 SHALL 被重定向至 `/login`。

`/user/{spiritId}/learning` SHALL 提供返回 `/user/{spiritId}` 的連結；`/user/{spiritId}/learning/{catalogId}` SHALL 提供返回 `/user/{spiritId}/learning` 的連結（他人唯讀視角下同樣指向該學員的對應上層頁，而非查看者自己的頁面）。

`{catalogId}` 若非合法數字、對應 `CourseCatalog` 不存在、或設定檔中無該目錄之大綱，系統 SHALL 重定向至 `/user/{spiritId}/learning`（本人與他人唯讀視角皆適用）。

管理者後台 SHALL NOT 提供任何檢視學員分段式查經筆記內容的頁面或查詢入口（本次異動範圍僅學員端彼此之間的唯讀查看，不涉及後台）。

#### Scenario: 本人存取書籍選擇頁

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}/learning`
- **THEN** 系統顯示三張書籍卡片（啟動靈人／啟動豐盛／啟動得勝），為可寫入視角

#### Scenario: 本人存取書籍子頁

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}/learning/{catalogId}`，且該目錄合法且有大綱
- **THEN** 系統顯示該目錄的課次卡片牆，為可寫入視角

#### Scenario: 無可見課程目錄時他人書籍選擇頁重定向

- **WHEN** 已登入使用者存取他人的 `/user/{otherSpiritId}/learning`，依「同班／好友唯讀查看他人筆記」判定對該學員沒有任何課程目錄可見
- **THEN** 系統重定向至查看者本人的 `/user/{selfSpiritId}/learning`

#### Scenario: 有可見課程目錄時他人書籍選擇頁唯讀顯示

- **WHEN** 已登入使用者存取他人的 `/user/{otherSpiritId}/learning`，對該學員至少一個課程目錄可見
- **THEN** 系統以唯讀模式顯示該學員的書籍選擇頁，僅列出可見的課程目錄，不顯示不可見目錄

#### Scenario: 不可見的 catalogId 時他人子頁重定向

- **WHEN** 已登入使用者存取他人的 `/user/{otherSpiritId}/learning/{catalogId}`，該 `{catalogId}` 對查看者不可見
- **THEN** 系統重定向至查看者本人的 `/user/{selfSpiritId}/learning/{catalogId}`

#### Scenario: 可見的 catalogId 時他人子頁唯讀顯示

- **WHEN** 已登入使用者存取他人的 `/user/{otherSpiritId}/learning/{catalogId}`，該 `{catalogId}` 對查看者可見
- **THEN** 系統以唯讀模式顯示該學員在該課程目錄下的課次與已填寫筆記內容，不提供任何新增或編輯入口

#### Scenario: 未登入存取

- **WHEN** 未登入使用者存取 `/user/{spiritId}/learning` 或其子頁
- **THEN** 系統重定向至 `/login`

#### Scenario: 非法的 catalogId

- **WHEN** 已登入使用者存取 `/user/{spiritId}/learning/{catalogId}`（本人或唯讀視角皆適用），但 `{catalogId}` 非數字、無對應 `CourseCatalog`、或設定檔無該目錄大綱
- **THEN** 系統重定向至 `/user/{spiritId}/learning`

#### Scenario: 管理者後台不提供檢視入口

- **WHEN** 管理者於後台尋找可檢視學員分段式查經筆記內容的頁面或 API
- **THEN** 系統不提供此類入口

## ADDED Requirements

### Requirement: 同班／好友唯讀查看他人筆記

系統 SHALL 依下列規則判定查看者（viewer）是否可唯讀查看某學員（author）在某課程目錄（`courseCatalogId`）下的分段式查經筆記，三條件之一成立即視為可見：

1. **本人**：viewer 與 author 為同一帳號。
2. **好友**：viewer 已將 author 加入好友清單（`Friendship`，`ownerId = viewer`、`friendId = author`，單向，不需 author 同意或互加）。符合此條件時，author**已解鎖**的全部課程目錄皆對 viewer 可見，不限特定課程目錄。
3. **同班**：author 在該課程目錄下存在至少一筆 `status = approved`、所屬開課未取消且 `startedAt` 已設定的報名（`InviteEnrollment`），且 viewer 在**同一次開課**（相同 `inviteId`）下也存在 `status = approved`、該開課未取消的報名。

不符合以上任一條件者，該課程目錄對 viewer SHALL NOT 可見。

此可見性判定 SHALL 為即時查詢（依當前 `InviteEnrollment`／`Friendship` 狀態計算），SHALL NOT 以快照方式記錄於筆記本身；好友關係解除或報名狀態變動後，下一次查詢 SHALL 反映最新結果。

若 author 在同一課程目錄下存在多筆 `approved` 報名（對應不同次開課），任一次開課的同學皆視為對該課程目錄「同班」可見，SHALL NOT 區分到特定梯次。

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

#### Scenario: 非同班非好友不可見

- **WHEN** viewer 與 author 並非好友，且兩人在 author 已解鎖的所有課程目錄下皆無共同的 `inviteId` 報名
- **THEN** viewer 對 author 的所有課程目錄筆記皆不可見

#### Scenario: 同一課程目錄上過兩梯時兩梯同學皆可見

- **WHEN** author 在「啟動靈人」有兩筆 `approved` 報名，分屬開課 A 與開課 B；viewer 在開課 B 亦為 `approved` 報名
- **THEN** viewer 可唯讀查看 author 在「啟動靈人」下的全部筆記（含對應開課 A 撰寫的筆記），不限定僅開課 B 期間的筆記

#### Scenario: 唯讀視角不可編輯或刪除

- **WHEN** viewer 以同班或好友身分唯讀查看 author 的筆記
- **THEN** 畫面不顯示任何新增、編輯或刪除按鈕；viewer 若直接呼叫 `updateStudyEntry` 修改該筆記，系統依既有擁有者驗證回傳無權限錯誤，不異動資料

#### Scenario: 好友關係解除後即時失去好友可見性

- **WHEN** viewer 原本已將 author 加入好友清單並可唯讀查看其筆記，之後 viewer 將 author 從好友清單移除，且兩人無同班關係
- **THEN** 下一次查詢起，viewer 對 author 的筆記不再可見
