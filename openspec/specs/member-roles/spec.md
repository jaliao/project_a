## ADDED Requirements

### Requirement: 多重身分資料模型
會員身分 SHALL 以身分集合表示，取代單一 `role` 欄位。可用身分為四種：一般會員（`user`）、講師（`teacher`）、管理者（`admin`）、超級管理者（`superadmin`）。同一會員 SHALL 能同時持有多種身分。

#### Scenario: 會員持有多種身分
- **WHEN** 某會員同時具備講師與管理者身分
- **THEN** 其身分集合包含 `teacher` 與 `admin`，系統各項授權判定皆視其同時具備兩者

#### Scenario: 僅一般會員
- **WHEN** 某會員未被指派任何加掛身分
- **THEN** 其身分集合僅含 `user`

### Requirement: 一般會員為身分基線
每位會員的身分集合 SHALL 至少包含 `user`（一般會員為基底）；`teacher`、`admin`、`superadmin` 為加掛身分。系統 SHALL NOT 允許將身分集合清空至不含 `user`。

#### Scenario: 加掛身分時保留基線
- **WHEN** 管理者為會員加上 `admin` 身分
- **THEN** 該會員身分集合為 `{user, admin}`，`user` 基線保留

#### Scenario: 移除所有加掛身分後仍為一般會員
- **WHEN** 管理者移除某會員的所有加掛身分
- **THEN** 該會員身分集合回到 `{user}`，仍可正常登入使用一般會員功能

### Requirement: 身分授權判定
系統 SHALL 提供集中式授權判定，作為所有守衛的單一真實來源：
- `canAccessAdmin`：身分集合含 `admin` 或 `superadmin`
- `isSuperadmin`：身分集合含 `superadmin`
- `canTeach`：身分集合含 `teacher` 或 `admin` 或 `superadmin`
- `hasRole`：泛用判定身分集合是否含指定身分

#### Scenario: 管理者可存取後台
- **WHEN** 身分集合含 `admin` 或 `superadmin`
- **THEN** `canAccessAdmin` 為真，允許存取後台

#### Scenario: 管理者視同具開課權限
- **WHEN** 身分集合含 `admin` 或 `superadmin`（即使未含 `teacher`）
- **THEN** `canTeach` 為真

#### Scenario: 一般會員無後台與開課權限
- **WHEN** 身分集合僅含 `user`
- **THEN** `canAccessAdmin` 與 `canTeach` 皆為假

### Requirement: 既有身分資料遷移
系統升級時 SHALL 將既有單一 `role` 轉換為身分集合，對應規則為：`user → {user}`、`admin → {user, admin}`、`superadmin → {user, superadmin}`。

#### Scenario: 既有管理者遷移
- **WHEN** 升級前某會員 `role = admin`
- **THEN** 升級後其身分集合為 `{user, admin}`

#### Scenario: 既有超級管理者遷移
- **WHEN** 升級前某會員 `role = superadmin`
- **THEN** 升級後其身分集合為 `{user, superadmin}`
