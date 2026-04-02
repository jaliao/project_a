## Why

會員資料欄位不完整（缺英文名、性別），且系統各處顯示名稱邏輯各自為政（部分用 `realName`、部分用 `name`）。統一「顯示名稱」邏輯並提供匿名偏好設定，可讓會員控制在課程列表等公開場合的呈現方式。

## What Changes

- `User` 新增欄位：`englishName String?`（英文名）、`Gender` enum（`male` | `female` | `unspecified`）、`displayNameMode` enum（`chinese` | `english`，預設 `chinese`）
- 新增 `MemberDisplayName` 共用元件，統一全站會員姓名顯示邏輯：
  - `chinese` 模式：匿名名稱 = `nickname` 或 `realName`
  - `english` 模式：匿名名稱 = `englishName` 或 `name`
  - 若匿名名稱 == `realName`：直接顯示名稱（不加括號）
  - 否則：顯示 `{匿名名稱}（{realName}）`
- 個人資料頁新增英文名稱、性別、顯示名稱偏好欄位
- 更新現有顯示名稱的程式碼改用 `MemberDisplayName` 元件或共用 helper
- `prisma/seed.ts` 全面更新：
  - 管理者帳號改為 `101@iwillshare.org.tw`
  - 20 位種子會員（含電話、英文名、所屬教會，依序排列）

## Capabilities

### New Capabilities
- `member-display-name`: 統一會員顯示名稱元件，支援中/英文匿名偏好，括號省略規則

### Modified Capabilities
- `user-profile`: 個人資料新增英文名稱、性別、顯示名稱偏好欄位
- `admin-seed`: 管理者 email 更新、20 位種子會員含完整資料
- `admin-member-management`: 會員詳情頁補顯示英文名、性別、顯示名稱偏好

## Impact

- `prisma/schema/user.prisma` — 新增 `Gender` enum、`DisplayNameMode` enum、`englishName`、`gender`、`displayNameMode` 欄位
- `lib/utils/member-display.ts` — 新增 `getMemberDisplayName(user)` helper 函式
- `components/member/member-display-name.tsx` — 新增顯示元件（Server/Client 通用）
- `lib/schemas/profile.ts` — 新增欄位驗證
- `app/actions/profile.ts` — 更新儲存邏輯
- `app/(user)/profile/profile-form.tsx` — 新增欄位 UI
- 多處現有顯示名稱程式碼 — 改用共用 helper
- `prisma/seed.ts` — 全面更新種子資料
