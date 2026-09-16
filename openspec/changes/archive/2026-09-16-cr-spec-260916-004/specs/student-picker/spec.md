## ADDED Requirements

### Requirement: 通用單選學員選擇元件

系統 SHALL 提供通用元件 `StudentPicker`（`components/shared/student-picker.tsx`），供任何情境以單選方式從既有會員中選定一位學員。元件 SHALL 接受呼叫端傳入的好友清單（`FriendListItem[]`）與搜尋函式（`onSearch`），本身 SHALL NOT 內建任何資料授權邏輯——搜尋的資料範圍與授權檢查 SHALL 由呼叫端各自提供的 `onSearch` 實作負責，元件僅負責觸發搜尋、呈現清單、接收點選。

點選任一候選人（無論來自好友清單或搜尋結果）SHALL 立即回傳該筆候選資料（`userId`、`spiritId`、顯示名稱、頭像）並結束選取，SHALL NOT 支援同時選取多位。

#### Scenario: 點選後單選回傳
- **WHEN** 使用者在 `StudentPicker` 中點選任一候選人（好友清單或搜尋結果皆可）
- **THEN** 元件呼叫 `onSelect` 回傳該候選人資料，選取流程結束

#### Scenario: 元件本身不做授權判斷
- **WHEN** 不同呼叫端以不同的 `onSearch` 實作套用 `StudentPicker`
- **THEN** 各自呼叫端的授權與資料範圍規則完全生效，元件不額外限制或放寬資料範圍

### Requirement: 未輸入關鍵字時顯示社群好友清單可直接點選

`StudentPicker` 於搜尋關鍵字為空字串時，SHALL 直接呈現呼叫端傳入的好友清單（依 `getMyFriends()` 原有「釘選優先→加入時間新到舊」排序，不重新排序），使用者 SHALL 能不輸入任何文字、直接點選清單中的好友完成選取。呼叫端傳入的排除清單（`excludeUserIds`）SHALL 同時套用於此好友清單的呈現。

#### Scenario: 空關鍵字顯示好友清單
- **WHEN** 使用者開啟 `StudentPicker` 且尚未輸入任何關鍵字
- **THEN** 元件顯示呼叫端傳入的好友清單，依釘選優先、加入時間新到舊排序

#### Scenario: 點選好友清單中的一位直接完成選取
- **WHEN** 使用者未輸入關鍵字，直接點選好友清單中的一位
- **THEN** 元件回傳該好友資料並結束選取，不需先搜尋

#### Scenario: 排除清單套用於好友清單
- **WHEN** 呼叫端傳入 `excludeUserIds` 且其中包含某位好友的 `userId`
- **THEN** 該好友不出現在好友清單中

#### Scenario: 尚無好友時的空狀態
- **WHEN** 使用者尚未加任何社群好友，開啟 `StudentPicker` 且未輸入關鍵字
- **THEN** 元件顯示提示尚無好友的空狀態文字，不顯示空清單

### Requirement: 輸入關鍵字後以既有會員模糊搜尋、好友優先排序

`StudentPicker` 於使用者輸入關鍵字後（debounce，避免每個按鍵皆送出請求），SHALL 呼叫呼叫端傳入的 `onSearch(query)` 取得候選清單並呈現，取代好友清單畫面。搜尋涵蓋欄位 SHALL 為啟動編號（`spiritId`）、姓名（`realName`／`name`）、暱稱（`nickname`）、登入 Email（`email`，SHALL NOT 比對通訊 Email `commEmail`），皆為不分大小寫的模糊（子字串）比對。

搜尋結果中，操作者（呼叫 `onSearch` 當下登入之使用者）**已加為好友**的候選人 SHALL 排序在**非好友**候選人之前。

#### Scenario: 以啟動編號模糊搜尋
- **WHEN** 使用者輸入啟動編號的部分字串
- **THEN** 元件顯示 `spiritId` 包含該字串的既有會員

#### Scenario: 以姓名或暱稱模糊搜尋
- **WHEN** 使用者輸入姓名或暱稱的部分字串
- **THEN** 元件顯示 `realName`／`name`／`nickname` 任一欄位包含該字串的既有會員

#### Scenario: 以登入 Email 模糊搜尋
- **WHEN** 使用者輸入登入 Email 的部分字串
- **THEN** 元件顯示 `email` 欄位包含該字串的既有會員，SHALL NOT 額外比對該會員的通訊 Email

#### Scenario: 搜尋結果中好友優先排序
- **WHEN** 搜尋結果同時包含操作者的好友與非好友
- **THEN** 好友排序在非好友之前

#### Scenario: 查無符合結果
- **WHEN** 輸入的關鍵字沒有任何既有會員符合
- **THEN** 元件顯示查無符合結果的空狀態文字，不顯示錯誤訊息
