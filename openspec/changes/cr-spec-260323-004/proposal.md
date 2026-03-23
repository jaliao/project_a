## Why

啟動靈人系統目前缺乏完整的會員管理機制，無法支援 Email 自主註冊、格式化身分編號核發、多管道帳號連動，以及通訊信箱與登入帳號分離等企業需求。本次建立完整的會員模組，作為後續課程登記、書本寄送與邀請機制的身分基礎。

## What Changes

- 新增 Spirit ID（PA + YY + XXXX）自動核發機制，全系統唯一且不可更改
- 新增 Email 註冊路徑：後端核發隨機臨時密碼並寄送通知信
- 新增強制首次登入密碼變更攔截（`is_temp_password` 標記）
- 新增忘記密碼流程（發送重設連結或新臨時密碼）
- 新增通訊 Email（`comm_email`）與登入帳號分離機制，含驗證狀態追蹤
- 新增第三方帳號連動（Google / LINE）至個人 Profile
- 新增 User Profile 編輯：真實姓名、手機號碼、收件地址
- 現有 Google OAuth 登入保留，首次登入自動建立帳號並核發 Spirit ID

## Capabilities

### New Capabilities
- `spirit-id`: Spirit ID（PA + YY + XXXX）流水號核發與唯一性保證
- `email-registration`: Email 自主註冊、臨時密碼核發與通知信寄送
- `password-lifecycle`: 強制首次密碼變更攔截、忘記密碼重設流程
- `comm-email`: 通訊 Email 管理（與登入帳號分離、驗證狀態、變更重驗流程）
- `account-linking`: 第三方帳號（Google / LINE）與手機號碼綁定管理
- `user-profile`: 個人資料編輯（真實姓名、手機、收件地址、連動狀態顯示）

### Modified Capabilities
- （無現有 specs，本次全部為新建）

## Impact

- **資料庫**：`User` 模型需新增欄位（`spiritId`, `isTemp​Password`, `commEmail`, `isCommVerified`, `realName`, `phone`, `address`, `lineId`）；新增 `SpiritIdCounter` 計數表
- **認證層**：`lib/auth.ts` 需處理 Email provider、首次登入攔截邏輯
- **Server Actions**：新增 `app/actions/auth.ts`（註冊、密碼變更、重設）、`app/actions/profile.ts`（資料編輯、帳號連動）
- **Email 服務**：需整合寄信機制（臨時密碼通知、驗證信、密碼重設信）
- **路由**：新增 `/register`、`/forgot-password`、`/change-password`、`/(user)/profile` 頁面
- **中介層**：`middleware.ts` 需加入 `is_temp_password` 攔截邏輯
- **NextAuth**：需加入 Credentials provider（Email/密碼登入）與 LINE OAuth provider
