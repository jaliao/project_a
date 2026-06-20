## 1. 資料模型

- [x] 1.1 `prisma/schema/user.prisma`：`DisplayNameMode` enum 改為 `nickname`／`nickname_zh`／`nickname_en`，`displayNameMode` 預設改 `@default(nickname)`
- [x] 1.2 產生並套用 migration、重生 Prisma client

## 2. 顯示名稱核心邏輯與元件

- [x] 2.1 重寫 `lib/utils/member-display.ts` 的 `getMemberDisplayName`：基底 `nickname → realName → englishName`（移除 `name`/`email`）、模式加註 `（realName）`/`（englishName）`、空或同基底省略括號、全空為「（未填）」；移除「匿名」用語與型別改為三模式
- [x] 2.2 更新 `components/member/member-display-name.tsx` 的 `displayNameMode` 型別為三模式

## 3. 個人資料表單與驗證

- [x] 3.1 `lib/schemas/profile.ts`：`displayNameMode` 改 `z.enum(['nickname','nickname_zh','nickname_en'])`，預設 `nickname`
- [x] 3.2 `app/(user)/profile/profile-form.tsx` 與 `app/(user)/user/[spiritId]/profile/profile-form.tsx`：選擇器三選項、文案改「暱稱／暱稱（中文名稱）／暱稱（英文名稱）」（移除「匿名」）、型別更新、即時預覽沿用 `getMemberDisplayName`

## 4. 全站人名顯示稽核（系統標準）

- [x] 4.1 課程相關改用 `MemberDisplayName`/`getMemberDisplayName`：`app/(user)/course/[id]/page.tsx`、`pending-enrollment-list.tsx`、`components/course-session/enrolled-students-list.tsx`、`instructor-feedback-button.tsx` 的 studentName 來源
- [x] 4.2 後台改用標準元件：`app/(user)/admin/members/page.tsx`、`[id]/page.tsx`、`components/admin/member-hierarchy-tree.tsx`
- [x] 4.3 其他人名顯示：`app/(user)/invites/page.tsx`、`learning/page.tsx`、`lib/data/course-message.ts`（留言作者名）
- [x] 4.4 各改寫處的資料層 select 補 `nickname`/`realName`/`englishName`/`displayNameMode`；Email 顯示維持不變（聯繫用途）
- [x] 4.5 全域搜尋 `\.name ?? .*email`、`realName ?? .*name`、直接 `\.user\.name` 等樣式，確認無漏（名稱不以 realName/Email 充當）

## 5. Seed 與收尾

- [x] 5.1 `prisma/seed.ts` 的 `displayNameMode` 對齊新值（或移除改吃預設）
- [x] 5.2 `config/version.json` patch 版本號 +1
- [x] 5.3 更新 `README-AI.md`（DisplayNameMode 新值、顯示名稱規則為系統標準）
- [x] 5.4 更新 `doc/學員手冊.md`／`doc/管理者操作手冊.md`（顯示名稱方式說明、暱稱用語）；更新檔首版本與日期
- [x] 5.5 `npx tsc --noEmit` 通過

## 6. 驗證

- [x] 6.1 三種模式顯示正確（暱稱／暱稱（中文）／暱稱（英文）），括號省略規則正確
- [x] 6.2 暱稱空時退回中文名稱→英文名稱→「（未填）」，不顯示真實姓名或 Email 充當名稱
- [x] 6.3 課程頁、後台學員頁、清單、師生樹、留言之人名皆為顯示名稱；Email 仍正常顯示供聯繫
- [x] 6.4 個人資料選擇器三選項、無「匿名」字樣、預覽即時更新
