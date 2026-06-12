## Why

現行名冊式 seed（`cr-spec-260605-001`）會建立 231 位具 `teacher` 身分的老師，但**沒有發給任何結業證書**。在兩層開課把關下（teacher 身分過第一層、結業該課程過第二層），這些老師雖有身分卻**無法實際開課**（精靈 Step 1 選不到啟動靈人）。此外報名未設定教材選擇、課程結業狀態也未反映真實營運。需優化 seed 使開發資料貼近實況。

## What Changes

- 重寫 `prisma/seed.ts` 的課程／報名建立邏輯（資料源仍為 `prisma/seed-data/roster.json`，源自 `doc/啟動事工資料表_updated.xlsx`；roster 產生器與 JSON 不需重產）。
- **教師結業證書**：凡報名學員本身為老師（roles 含 `teacher`）→ 該筆 `InviteEnrollment` 設 `graduatedAt`（取得啟動靈人結業證書）。因每位老師都至少當過一次學員（含收容班），**231 位老師全數取得證書**，滿足「能開課的老師都有啟動靈人結業證書」。
- **課程結業**：若某課程所有學員皆為老師 → 該 `CourseInvite` 設 `completedAt`（已結業）；混合班維持進行中（僅 `startedAt`）。
- **教材**：所有 `InviteEnrollment` 的 `materialChoice` 設為 `traditional`（繁體中文教材）。
- **保留帳號**：黃國倫（PA260001）補一筆啟動靈人 `graduatedAt` 報名，維持其開課資格。

## Capabilities

### New Capabilities
- `seed-roster-data`：名冊式 seed 的權威規格——由 roster 建立人員／教會／課程／報名，並涵蓋本次新增的教師結業證書、全老師班課程結業、繁體教材規則。

### Modified Capabilities
- `seed-course-completions`：**REMOVE** 過時的「Seed 建立示範課程邀請」與「Seed 建立黃國倫結業紀錄」需求（描述名冊化之前的管理員示範課程 seed，已被名冊式 seed 取代）。

## Impact

- **`prisma/seed.ts`**（重寫課程／報名段落，現第 6、7 段）：
  - 預先建立 `teacherKeys` 集合（roster.people 中 roles 含 teacher 者）。
  - 每筆報名：`status='approved'`、`materialChoice='traditional'`、`joinedAt=SNAPSHOT_DATE`；若學員為老師 → 加 `graduatedAt=SNAPSHOT_DATE`。
  - 每門課（含收容班）：若所有學員皆為老師 → `completedAt=SNAPSHOT_DATE`（並保留 `startedAt`）。
  - 黃國倫：建立一筆啟動靈人 approved + graduatedAt 報名。
- **無 DB schema 變更**（沿用 `InviteEnrollment.graduatedAt`/`materialChoice`、`CourseInvite.completedAt`）。
- `roster.json`／`build-roster.mjs`／來源 xlsx **不變**。
- 冪等守衛沿用（收容班哨兵 `alreadySeeded`）。
- 依專案規範：完成後 `config/version.json` patch +1、重產 `README-AI.md`。**三份操作手冊不需更新**（seed 為開發資料，不影響使用者操作流程；仍會逐一檢查確認）。
