## 1. seed.ts 教師集合與報名規則

- [x] 1.1 在 `prisma/seed.ts` 建立 `teacherKeys = new Set(people 中 roles 含 'teacher' 的 key)`
- [x] 1.2 報名列 (`enrollmentRows`) 型別與建立補上 `materialChoice: 'traditional'`，並對教師學員加 `graduatedAt: SNAPSHOT_DATE`（以 `teacherKeys.has(sKey)` 判定）
- [x] 1.3 收容班報名同樣套用：教師學員 `graduatedAt`、`materialChoice: 'traditional'`

## 2. seed.ts 課程結業規則

- [x] 2.1 一般課程建立時，若 `studentKeys` 非空且全部 `teacherKeys.has(...)` → `CourseInvite.completedAt = SNAPSHOT_DATE`（保留 `startedAt`）
- [x] 2.2 收容班（學員皆 unmatched 教師）建立時設 `completedAt = SNAPSHOT_DATE`

## 3. 黃國倫結業報名

- [x] 3.1 於第一門建立的啟動靈人課程，為黃國倫建立一筆 `status='approved'`、`materialChoice='traditional'`、`graduatedAt=SNAPSHOT_DATE` 的報名（無課程時略過並記 log）

## 4. 執行與驗證

- [x] 4.1 `make prisma-seed`（或等效）重新 seed 並確認無錯誤
- [x] 4.2 驗證：教師結業證書數 = 231（`InviteEnrollment graduatedAt IS NOT NULL` 去重 userId 對應 teacher 數）
- [x] 4.3 驗證：全教師班課程 `completedAt` 有值；混合班為 null；所有報名 `materialChoice='traditional'`
- [x] 4.4 `npm run build` 通過（seed.ts 型別無誤）

## 5. 規範同步（依 CLAUDE.md）

- [x] 5.1 `config/version.json` patch +1
- [x] 5.2 重新產生 `README-AI.md`（seed 行為更新、任務日誌）
- [x] 5.3 已檢查三份操作手冊：seed 為開發資料、不影響使用者操作流程，無需更新
