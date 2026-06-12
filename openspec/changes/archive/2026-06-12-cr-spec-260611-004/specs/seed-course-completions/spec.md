## REMOVED Requirements

### Requirement: Seed 建立示範課程邀請
**Reason**: 名冊化之前的管理員示範課程 seed 已被名冊式 seed 取代（見 `seed-roster-data`）。
**Migration**: 開發資料由 `prisma/seed-data/roster.json` 經 `prisma/seed.ts` 建立，課程改以名冊班級欄產生。

### Requirement: Seed 建立黃國倫結業紀錄
**Reason**: 黃國倫的結業紀錄改由名冊式 seed 統一處理（見 `seed-roster-data`「黃國倫具開課資格」）。
**Migration**: 黃國倫於啟動靈人取得一筆 approved + graduatedAt 報名，維持 canTeach。
