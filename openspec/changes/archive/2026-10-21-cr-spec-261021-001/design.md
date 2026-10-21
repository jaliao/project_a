## Context

目標：對 `User.churchType=none` 的學員，依其「最新一筆報名」所屬開課老師的教會設定回填。資料來源：
- `InviteEnrollment`（`userId`、`inviteId`、`joinedAt`）
- `CourseInvite`（`id`、`createdById`）
- `User`（`churchType`、`churchId`、`churchOther`）

## Decisions

1. **多老師衝突時取最新報名**：學員可能被多位不同教會的老師邀請入班。依使用者確認，以 `InviteEnrollment.joinedAt` 最新一筆的老師教會為準（代表學員最近一次的歸屬關係）。
2. **churchOther 原樣複製**：老師 `churchType=other` 時，`churchOther` 自填文字一併複製，不做任何轉換或正規化。
3. **老師教會為 none 時跳過**：避免把「未設定」誤當成一種有效教會值回填。
4. **僅執行一次，不落地為系統規則**：確認為一次性回填，不修改報名/建課流程程式碼，未來新報名不會自動繼承老師教會。
5. **執行方式**：透過 `make tunnel-prd` 開 SSH tunnel 連正式 DB，先用唯讀 SQL 產出受影響清單人工核對，確認後執行 `UPDATE`，執行後 `SELECT` 覆核。不透過應用程式 Server Action（純資料庫層級的一次性修正，比照 CR-SPEC-261016-001 先例）。

## Risks

- 若同一學員有多筆報名、`joinedAt` 完全相同（極端情況），SQL 需有穩定的 tie-break（例如加上 `id DESC`），避免每次執行結果不一致。
- 正式環境操作不可逆：執行前務必先跑唯讀查詢並經人工確認清單後才執行 UPDATE。
