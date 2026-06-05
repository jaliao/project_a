## Why

現有 `prisma/seed.ts` 僅有少量測試帳號，無法呈現真實規模的會員、課程、報名與教會資料。需以正式名冊（`doc/啟動事工資料表_updated.xlsx`）建立貼近正式環境的開發 seed，方便測試多重身分、開課、報名、教會清單與會員管理等功能。

## What Changes

- **BREAKING（schema）**：`User` 新增 `teacherNo String?` 欄位（授課老師編號，如 `A001`），需 migration。
- **重寫 `prisma/seed.ts`**，資料來源改為 Excel 名冊（編譯為 TS 常數，不在執行期讀檔）：
  - **保留** `101@iwillshare.org.tw`（系統管理員，superadmin）與 `gordon@test.com`（黃國倫）兩筆既有帳號；其餘原測試學員移除，改用 Excel 名冊。
  - **教師（231 列 / 230 人）** → `User`：`roles = [user, teacher]`、Excel 真實 Email、`teacherNo`、`phone`、單位對應 `Church`（`churchType = church`）。
  - **學員（約 1282 人）** → `User`：`roles = [user]`、合成 Email（`{spiritId}@seed.iwillshare.org.tw`）、預設密碼 `Student@1234`、`isTempPassword = true`。
  - **人員去重以姓名為鍵**：同名視為同一人；既是教師又是學員者合併為單一 `User`（教師資料優先）。
  - **課程**：每位教師的每個非空「班級欄（班級一～十）」建立一筆 `CourseInvite`（掛 `啟動靈人` `courseCatalogId = 1`、`createdById = 該教師`、`startedAt` 設為快照日）；該班學員建立 `InviteEnrollment`（`status = approved`）。
  - **人人皆參加課程且有對應教師**：學員以其班級教師為對應；教師若同時是他人班級學員即視為已參加；**對應不到的教師（78 位）** → 由黃國倫開一門收容課程，將其全部加入為學員。
  - **教會清單正規化為 10 間**（合併 `GMI榮美`/`GMI榮美教會`、`i61為光教會`/`i61爲光教會` 變體）：101教會、Arise興起教會、GMI榮美教會、KUA、i61為光教會、全福會、心欣城市教會、桃園神帳幕教會、竹南靈糧堂、菲律賓。

## Capabilities

### New Capabilities
- `member-roster-seed`: 以啟動事工名冊建立開發 seed 的資料組成規則（保留 admin + 黃國倫、教師/學員建立與去重、每班一課程、對應不到歸黃國倫、教會正規化）與 `User.teacherNo` 欄位定義。

### Modified Capabilities
- （無 — 既有產品需求不變；本次為開發資料與資料模型欄位新增）

## Impact

- **資料模型**：`prisma/schema/user.prisma` 新增 `teacherNo String?`（+ migration `add_user_teacher_no`）。
- **Seed**：`prisma/seed.ts` 重寫；Excel 名冊轉為 TS 資料常數（可置於 `prisma/seed-data/` 或內嵌）。
- **教會**：seed 內教會清單由 4 筆改為正規化後 10 筆。
- **規模**：約 1500+ `User`、數百筆 `CourseInvite`、上千筆 `InviteEnrollment`；需注意 seed 執行效能（批次建立）與冪等（upsert / 既有資料偵測）。
- **不影響**：本次不改前後台 UI；`teacherNo` 是否於會員頁/匯出顯示另案處理。
