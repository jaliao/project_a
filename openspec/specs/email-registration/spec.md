# email-registration Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for email-registration.

## Requirements

### Requirement: 註冊頁 Google OAuth 入口
`/register` 頁面 SHALL 提供「以 Google 帳號繼續」按鈕，功能與行為和登入頁的 Google 按鈕一致。

#### Scenario: 點擊 Google 按鈕觸發 OAuth
- **WHEN** 使用者在 `/register` 頁點擊「以 Google 帳號繼續」
- **THEN** 系統觸發 Google OAuth 流程，成功後導向 `/dashboard`

#### Scenario: 已有帳號的 Google 使用者在註冊頁登入
- **WHEN** 使用者以已存在帳號的 Google email 完成 OAuth
- **THEN** 系統正常登入，不重複建立帳號，導向 `/dashboard`

### Requirement: Google OAuth 首次登入自動建帳
系統 SHALL 在 Google OAuth 使用者首次登入（含從 `/register` 頁觸發）時自動建立帳號並核發 Spirit ID。`/register` 與 `/login` 兩個入口均支援此流程。

#### Scenario: Google 新用戶首次登入
- **WHEN** 使用者以 Google 帳號首次進行 OAuth 登入（從任何入口）
- **THEN** 系統自動建立帳號、核發 Spirit ID，並導向 `/dashboard`

#### Scenario: Google 既有用戶再次登入
- **WHEN** 已建立帳號的使用者再次以 Google 登入
- **THEN** 系統正常登入，不重複建立帳號

### Requirement: 註冊需填妥完整基本資料才算成立帳號
`/register` 頁的 Email 註冊表單 SHALL 與 Email 同一次送出收集完整基本資料：`realName`（真實姓名）、`phone`（手機號碼）、`gender`（性別，男／女）、`birthYear`（出生年，1900 至當年之西元年整數）、所屬教會（`churchType` 為 `church` 時需 `churchId`、為 `other` 時需 `churchOther`，不接受 `none`）。系統 SHALL 在同一次驗證中確認 Email 格式、Email 唯一性與上述基本資料全部有效，**任一項驗證失敗時 SHALL NOT 建立任何 `User` 紀錄**，僅回傳對應欄位錯誤。

僅當全部驗證通過時，系統 SHALL 以提交的基本資料與 Email 一次性建立 `User`（含核發 `spiritId`、產生臨時密碼），並寄送臨時密碼通知信；此帳號建立後視為已完成基本資料，不需再透過 onboarding 補填。

#### Scenario: 完整填妥基本資料註冊成功
- **WHEN** 使用者於 `/register` 送出有效 Email 與完整基本資料（姓名、手機、性別、出生年、所屬教會皆有效）
- **THEN** 系統建立 `User` 紀錄（含上述基本資料、`spiritId`、臨時密碼），寄送臨時密碼通知信，顯示註冊成功 Dialog

#### Scenario: 僅填 Email 未填基本資料時拒絕且不建帳號
- **WHEN** 使用者於 `/register` 只填 Email、未填姓名／手機／性別／出生年／所屬教會任一項即送出
- **THEN** 系統回傳對應欄位層級驗證錯誤，SHALL NOT 建立任何 `User` 紀錄

#### Scenario: Email 已被使用時拒絕且不建帳號
- **WHEN** 使用者送出的 Email 已被其他帳號使用（即使其餘基本資料皆有效）
- **THEN** 系統回傳 Email 欄位錯誤「此 Email 已被使用」，SHALL NOT 建立任何 `User` 紀錄

#### Scenario: 性別或出生年格式不符時拒絕且不建帳號
- **WHEN** 使用者送出的性別非男／女、或出生年超出 1900 至當年範圍
- **THEN** 系統回傳對應欄位錯誤，SHALL NOT 建立任何 `User` 紀錄

#### Scenario: 所屬教會選「無」或資料不全時拒絕且不建帳號
- **WHEN** 使用者所屬教會選擇「無」、或選 `church` 卻未選教會、或選 `other` 卻未填教會名稱
- **THEN** 系統回傳所屬教會欄位錯誤，SHALL NOT 建立任何 `User` 紀錄

### Requirement: Email 註冊成功回饋
Email 註冊成功後，系統 SHALL 以 Dialog 告知使用者帳號已建立，並提供「返回首頁」按鈕導向 `/`。

#### Scenario: 註冊成功顯示 Dialog
- **WHEN** 使用者送出有效 Email 與完整基本資料，且 `registerWithEmail` 回傳 `success: true`
- **THEN** 系統開啟 Dialog，顯示成功訊息，不再顯示 toast

#### Scenario: 點擊返回首頁
- **WHEN** 使用者在成功 Dialog 中點擊「返回首頁」
- **THEN** 系統導向 `/`

#### Scenario: Dialog 無法直接關閉
- **WHEN** 使用者嘗試點擊 Dialog 背景或按 Esc
- **THEN** Dialog 維持開啟（使用者必須點擊「返回首頁」才能離開）
