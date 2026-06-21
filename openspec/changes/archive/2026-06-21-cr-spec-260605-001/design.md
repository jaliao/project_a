## Context

來源檔 `doc/啟動事工資料表_updated.xlsx`（單一工作表 `工作表2`，231 列教師）。欄位：`授課老師編號 / 授課老師 / 單位 / Email / 電話 / 班級一～十學員`，每個班級欄為逗號分隔學員名單。實測：230 唯一教師姓名、1282 唯一學員姓名、152 位教師同時出現在他人班級（可對應）、78 位對應不到、單位正規化後 10 間教會。

現有 `prisma/seed.ts`：upsert ADMIN（`101@iwillshare.org.tw`，superadmin、`PA000001`）與 STUDENTS 陣列（含黃國倫 `gordon@test.com`/`PA260001`），建立課程目錄 1–4、教會 4 筆、spiritIdCounter=20、示範課程。資料模型：`User`（email 唯一必填、spiritId 唯一、roles[]、churchType/churchId、teacherNo 待新增）、`Church`（name 唯一）、`CourseInvite`（courseCatalogId、createdById、startedAt…）、`InviteEnrollment`（inviteId/userId、status、唯一鍵 [inviteId,userId]）。

## Goals / Non-Goals

**Goals:**
- 以名冊建立貼近正式環境的開發 seed：教師/學員、課程、報名、教會。
- 保留 admin 與黃國倫；其餘人員來自 Excel。
- 冪等（可重複執行）、批次寫入（效能可接受）。
- 新增 `User.teacherNo` 保存授課老師編號。

**Non-Goals:**
- 不於執行期讀取 xlsx（改為預先產生、可提交的資料模組）。
- 不嘗試辨識「同名不同人」；seed 以姓名為唯一鍵（可接受的開發資料近似）。
- 不為學員寄信、不串接真實登入信箱。

## Decisions

### 1. Excel → 預先產生的資料模組（codegen）
新增產生器（`prisma/seed-data/build-roster.mjs`，用既有 `xlsx` 套件）解析 xlsx，輸出**已提交**的 `prisma/seed-data/roster.json`，內容為正規化後的 `people[]` / `courses[]` / `enrollments[]`。`seed.ts` 只 import JSON，不依賴 xlsx。
- **為何**：seed 執行不依賴二進位檔、結果可審閱與版本控管；重新匯入時重跑產生器即可。
- **替代**：執行期讀 xlsx（被 Non-Goal 排除）；手寫 TS 巨型字面量（不可維護）。

### 2. 人員以「姓名」為唯一鍵，建立 person registry
彙整教師列與所有班級學員為單一 registry（key = `realName` trim 後）。
- 教師資料優先：具 `teacherNo`、真實 Email、phone、church、`roles=[user,teacher]`。
- 純學員：`roles=[user]`、合成 Email、無 teacherNo。
- 既是教師又是學員 → 同一筆，roles=[user,teacher]，並在其作為學員的班級建立報名。

### 2.1 教師同名衝突（230 唯一 / 231 列）
有 1 組教師同名（不同編號）。產生器偵測同名教師時，第二筆以 `teacherNo` 後綴去重姓名鍵（例如顯示名相同但 registry key 加註編號），避免被誤併；兩者各自保有 teacherNo 與課程。決策於產生器中以 log 標示。

### 3. spiritId 與合成 Email
- 既有：admin `PA000001`、黃國倫 `PA260001` 保留不變。
- 其餘人員依序核發 `PA26XXXX`（4 位流水號，從 `0100` 起，避開 1–20 既有區段與測試帳號），確保唯一。
- 合成 Email：`{spiritId}@seed.iwillshare.org.tw`（小寫）。**教師若有 Excel Email 則優先採用**；教師 Email 與既有/彼此衝突時，退回合成 Email。
- seed 結束時將 `spiritIdCounter.seq` 設為已用最大流水號 + 1，避免與 `generateSpiritId` 衝突。

### 4. 課程與報名（每班一課程）
- 每位教師每個非空班級欄 → 一筆 `CourseInvite`：`courseCatalogId=1`（啟動靈人）、`createdById=該教師 User`、`title="{教師} 的 啟動靈人（班級N）"`、`maxCount=該班人數`、`startedAt=SNAPSHOT_DATE`、`courseDate` 設快照字串。
- 班級學員 → `InviteEnrollment`：`status=approved`、`joinedAt=SNAPSHOT_DATE`（不設 `graduatedAt`，視為已參加/進行中，符合「有參加課程」）。
- **教師參加課程對應**：教師若出現在他人班級即已含報名；對應不到的 78 位 → 由黃國倫建立 1 筆收容課程（啟動靈人），將其全部以 approved 報名加入。

### 5. 教會正規化
正規化對應表（`單位` → 正式名稱）：`GMI榮美→GMI榮美教會`、`i61爲光教會→i61為光教會`，其餘原樣。最終 10 間：101教會、Arise興起教會、GMI榮美教會、KUA、i61為光教會、全福會、心欣城市教會、桃園神帳幕教會、竹南靈糧堂、菲律賓。`Church` 以 name upsert；具單位的 `User` 設 `churchType=church` + `churchId`，無單位者 `churchType=none`。

### 6. teacherNo schema 欄位
`User` 新增 `teacherNo String?`（非唯一，允許 null；學員為 null）。migration `add_user_teacher_no`（純新增可空欄位，無 backfill 風險）。

### 7. 冪等與批次
- 以 email upsert（人員）、name upsert（教會）。
- 課程/報名：以「createdById 既有課程數」或固定旗標偵測，避免重複建立（沿用現有示範課程的偵測模式）。
- 批次：`createMany`（報名）+ 分批 user upsert，降低往返。
- 預設密碼沿用 `SEED_STUDENT_PASSWORD`（預設 `Student@1234`）；`isTempPassword=true`。

## Risks / Trade-offs

- [同名不同人被併為一人] → 接受（開發資料）；產生器對同名教師以編號區分並 log。
- [~1500 筆 upsert 效能慢] → 分批 + `createMany` 報名；可接受的一次性 seed 時間。
- [教師 Email 重複或不合法] → 退回合成 Email，保唯一。
- [重跑 seed 重複建課] → 以既有課程偵測旗標跳過；或先清資料再灌（文件註明 `make clean` 流程）。
- [Excel 內容日後變動] → 重跑產生器重生 `roster.json`，seed 不變。

## Migration Plan

1. `prisma/schema/user.prisma`：`User` 新增 `teacherNo String?`。
2. 建立 migration `add_user_teacher_no`（`ALTER TABLE "users" ADD COLUMN "teacherNo" TEXT;`）並套用、`prisma generate`。
3. 執行產生器 `build-roster.mjs` → 產出並提交 `prisma/seed-data/roster.json`。
4. 重寫 `prisma/seed.ts` 消費 roster.json；`make prisma-seed` 驗證。
5. **Rollback**：還原 migration（drop `teacherNo`）+ 還原 seed.ts/roster.json。

## Open Questions

（皆已確認）

- ✅ 重跑 seed 策略：使用者將以 `make clean` 重灌，seed 可假設乾淨 DB（仍保留 upsert/createMany 作保險）。
- ✅ `teacherNo` SHALL 顯示於會員詳情頁與 Excel 匯出（本次納入；見 Decision 8）。

### 8. teacherNo 顯示（會員頁 + 匯出）
- `lib/data/members.ts` 之 `getMemberDetail`、`exportMembers` select 加入 `teacherNo`。
- 會員詳情頁基本資料區新增「授課老師編號」欄位（無則顯示 —）。
- 匯出 Excel 新增「授課老師編號」欄。

