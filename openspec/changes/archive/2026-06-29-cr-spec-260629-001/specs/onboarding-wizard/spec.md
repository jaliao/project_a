## MODIFIED Requirements

### Requirement: Step 2 — 填寫基本資料
Step 2 SHALL 要求用戶填寫 `realName`（真實姓名）、`phone`（手機號碼）、`gender`（性別）、`birthYear`（出生年，西元）與所屬教會（`churchType` 及對應 `churchId`／`churchOther`），全部為**必填**，成功後進入 Step 3。

必填判定規則：
- `gender` SHALL 為 `male` 或 `female`（不接受 `unspecified`）。
- `birthYear` SHALL 為合理西元年（1900 至當年）之 4 位數整數。
- 所屬教會 SHALL 為 `church`（含有效 `churchId`）或 `other`（含非空 `churchOther`）；不接受 `none`。

既有已完成首次登入的會員不受影響：`/onboarding` 放行條件維持以 `realName` 與 `phone` 判定，新增欄位僅在 Step 2 表單提交時驗證。

#### Scenario: 基本資料填寫成功進入 Step 3
- **WHEN** 用戶於 Step 2 輸入有效的 realName、phone、性別（男／女）、出生年與所屬教會並送出
- **THEN** 系統呼叫 `completeOnboardingProfile` action，成功後 Wizard 切換至 Step 3，進度指示更新為 3/3

#### Scenario: 必填欄位未填顯示驗證錯誤
- **WHEN** 用戶未填寫 realName、phone、性別、出生年或所屬教會其中任一即送出
- **THEN** 顯示對應欄位層級驗證錯誤，不進入 Step 3

#### Scenario: 性別停留未指定視為未填
- **WHEN** 用戶未選擇性別（停留於未指定）即送出
- **THEN** 顯示性別必填錯誤，不進入 Step 3

#### Scenario: 所屬教會選「無」視為未填
- **WHEN** 用戶所屬教會選擇「無」或未選清單教會／未填其他名稱即送出
- **THEN** 顯示所屬教會必填錯誤，不進入 Step 3

#### Scenario: 出生年超出合理範圍被拒
- **WHEN** 用戶輸入小於 1900、大於當年或非整數的出生年即送出
- **THEN** 顯示出生年範圍錯誤，不進入 Step 3

#### Scenario: 說明文字告知其餘欄位可後填
- **WHEN** 用戶進入 Step 2
- **THEN** 頁面顯示說明，告知必填以外的其餘資料可於個人資料頁補填，降低填寫壓力
