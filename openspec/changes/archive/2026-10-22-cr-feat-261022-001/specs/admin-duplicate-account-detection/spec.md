## MODIFIED Requirements

### Requirement: 疑似重複帳號清單
後台 SHALL 提供一個獨立頁面（`/admin/members/duplicates`），列出全站會員中 `realName` 非空且完全相同的配對，並依信心等級分級呈現：

1. **最高**：`realName` 相同，且配對中至少一方 email 符合 `isUndeliverableEmail`（合成 seed 信箱）或至少一方 `isProxyMember` 為 `true`。
2. **高**：`realName` 相同，且 `phone` 相同或 `commEmail` 相同。
3. **中**：`realName` 相同，且同 `churchId` 或 `birthYear`+`gender` 相同。

`realName` 為空的會員 SHALL NOT 參與比對。一組配對同時命中多個等級時，SHALL 僅以最高命中等級呈現一次，不得重複列出。清單 SHALL 依信心等級（最高 → 高 → 中）排序呈現。

#### Scenario: 同名且一方為合成信箱歸為最高信心
- **WHEN** 兩筆會員 `realName` 相同，其中一筆 email 為 `{spiritId}@seed.iwillshare.org.tw`
- **THEN** 該配對出現在清單中，標示為「最高」信心等級

#### Scenario: 同名且一方為代填學員歸為最高信心
- **WHEN** 兩筆會員 `realName` 相同，其中一筆 `isProxyMember` 為 `true`
- **THEN** 該配對出現在清單中，標示為「最高」信心等級

#### Scenario: 同名且電話或通訊 Email 相同歸為高信心
- **WHEN** 兩筆會員 `realName` 相同、皆非合成信箱、皆非代填學員，但 `phone` 相同或 `commEmail` 相同
- **THEN** 該配對出現在清單中，標示為「高」信心等級

#### Scenario: 同名且同教會或同出生年與性別歸為中信心
- **WHEN** 兩筆會員 `realName` 相同、不符合最高或高信心條件，但 `churchId` 相同或 `birthYear`+`gender` 皆相同
- **THEN** 該配對出現在清單中，標示為「中」信心等級

#### Scenario: 僅姓名相同、無其他輔助訊號不列入清單
- **WHEN** 兩筆會員 `realName` 相同，但 phone、commEmail、churchId、birthYear+gender 皆不符合或皆為空，且皆非合成信箱、皆非代填學員
- **THEN** 該配對不出現在清單中

#### Scenario: 姓名空白者不參與比對
- **WHEN** 會員 `realName` 為 null 或空字串
- **THEN** 該會員不會與任何其他會員配對出現在清單中

#### Scenario: 同一配對命中多等級僅列一次
- **WHEN** 兩筆會員 `realName` 相同，且同時符合「最高」與「高」信心條件
- **THEN** 該配對僅出現一次，標示為「最高」信心等級，不重複列出

### Requirement: 候選配對呈現內容與機敏欄位遮蔽
每組候選配對 SHALL 並排顯示兩邊會員的啟動編號（spiritId）、顯示名稱、Email、電話、建立時間、是否未啟用（`lastLoginAt` 是否為 null）、是否為代填學員（`isProxyMember`，以「未註冊」徽章呈現）、報名或結業紀錄筆數，並各提供連到既有會員詳情頁的連結。其中 Email、電話欄位 SHALL 套用既有機敏欄位遮蔽規則（預設遮蔽、點擊切換明文），行為與後台其他會員頁面一致。

本頁面本身 SHALL NOT 直接執行任何合併、刪除、編輯或其他寫入操作；每組候選配對 SHALL 額外提供一個「合併這兩筆帳號」連結，點擊後開啟合併精靈對話框並帶入該組兩筆帳號（見 `admin-member-management` 之「合併帳號」需求），實際的預覽查詢與合併動作皆在該對話框內以獨立 Server Action 完成，SHALL NOT 使本頁面的 server component 本身產生任何寫入。

#### Scenario: 候選配對並排顯示關鍵欄位
- **WHEN** 管理者開啟疑似重複帳號清單
- **THEN** 每組配對並排顯示兩邊的啟動編號、顯示名稱、遮蔽後的 Email／電話、建立時間、是否未啟用、是否為代填學員、報名或結業紀錄筆數

#### Scenario: 代填學員一側顯示未註冊徽章
- **WHEN** 某組候選配對中有一方 `isProxyMember` 為 `true`
- **THEN** 該側顯示「未註冊」徽章

#### Scenario: 機敏欄位預設遮蔽可切換
- **WHEN** 管理者點擊候選配對中遮蔽狀態的 Email 或電話欄位
- **THEN** 該欄位切換為明文顯示，行為與既有機敏欄位遮蔽規則一致

#### Scenario: 無任何直接寫入操作，僅提供合併連結
- **WHEN** 管理者檢視疑似重複帳號清單
- **THEN** 畫面上不存在直接執行合併、刪除或編輯的按鈕；每組配對僅有「查看詳情」的導覽連結與「合併這兩筆帳號」連結（開啟合併精靈對話框，不在本頁直接寫入）

#### Scenario: 由候選配對開啟合併精靈並帶入雙方帳號
- **WHEN** 管理者點擊某組候選配對的「合併這兩筆帳號」連結
- **THEN** 合併精靈對話框開啟，並已帶入該組兩筆帳號供後續指定主/副帳號與預覽，不需管理者重新搜尋選擇
