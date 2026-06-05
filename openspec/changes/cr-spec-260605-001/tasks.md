## 1. Schema：teacherNo 欄位

- [x] 1.1 `prisma/schema/user.prisma`：`User` 新增 `teacherNo String?`（授課老師編號）
- [x] 1.2 建立並套用 migration `add_user_teacher_no`（`ALTER TABLE "users" ADD COLUMN "teacherNo" TEXT;`），`prisma generate`

## 2. 名冊產生器（Excel → roster.json）

- [x] 2.1 新增 `prisma/seed-data/build-roster.mjs`：以 `xlsx` 解析 `doc/啟動事工資料表_updated.xlsx`
- [x] 2.2 教會正規化對應表（`GMI榮美→GMI榮美教會`、`爲光→為光`…），輸出 10 間 canonical 清單
- [x] 2.3 建立 person registry（姓名為鍵）：教師（teacherNo/email/phone/church/roles）+ 班級學員；同名教師以編號區分並 log
- [x] 2.4 spiritId 依序核發（`PA26` + 4 位，從 0100 起；保留 admin `PA000001`、黃國倫 `PA260001`）；合成 Email `{spiritId}@seed.iwillshare.org.tw`，教師 Email 衝突則退回合成
- [x] 2.5 組出 courses[]（每位教師每個非空班級欄一筆，掛 catalog 1）、enrollments[]（班級學員 approved）
- [x] 2.6 計算對應不到的教師清單（不在任何班級名單者），標記歸入黃國倫收容課程
- [x] 2.7 輸出並提交 `prisma/seed-data/roster.json`（含 people / churches / courses / enrollments / unmatchedTeachers）

## 3. 重寫 seed.ts

- [x] 3.1 保留 ADMIN（`101@iwillshare.org.tw` superadmin）與黃國倫（`gordon@test.com`）區塊；移除其餘原 STUDENTS
- [x] 3.2 import `roster.json`；以正規化清單 upsert `Church`（name 唯一）
- [x] 3.3 分批 upsert 人員 `User`（email 為鍵；教師 `[user,teacher]`+teacherNo，學員 `[user]`；church 對應、預設密碼、isTempPassword）
- [x] 3.4 建立課程：每筆 course → `CourseInvite`（createdById=教師、catalog 1、startedAt=快照日）；以既有偵測旗標確保冪等
- [x] 3.5 建立報名：班級學員 + 對應到的教師 → `InviteEnrollment`（approved），`createMany` 批次
- [x] 3.6 黃國倫收容課程：建立 1 筆 `CourseInvite`，將對應不到的教師全部 approved 報名
- [x] 3.7 課程目錄保持 1–4；spiritIdCounter 設為已用最大流水號 + 1；更新 console 輸出摘要

## 3b. teacherNo 顯示（會員頁 + 匯出）

- [x] 3b.1 `lib/data/members.ts`：`getMemberDetail`、`exportMembers` select 加入 `teacherNo`
- [x] 3b.2 會員詳情頁基本資料區新增「授課老師編號」欄位（無值顯示「—」）
- [x] 3b.3 匯出 route 新增「授課老師編號」欄（教師填編號、學員留空）

## 4. 驗證

- [x] 4.1 `make prisma-seed` 執行成功，無唯一鍵衝突
- [x] 4.2 DB 驗證：User 數（admin+黃國倫+教師+學員去重後）、Church=10、CourseInvite 數=非空班級欄數(+1 收容)、InviteEnrollment 無重複
- [x] 4.3 抽查：教師具 `[user,teacher]`+teacherNo、學員具 `[user]`+合成 Email、對應不到教師已在黃國倫課程、教師兼學員僅一筆
- [x] 4.4 重複執行 seed 一次確認冪等（無重複資料）

## 5. 收尾

- [x] 5.1 `npm run build` TypeScript 型別檢查通過
- [x] 5.2 依 `.ai-rules.md` 更新 `README-AI.md`，`config/version.json` patch +1
