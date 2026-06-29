## Why

課程詳情頁的「結業資訊」區塊目前對所有登入會員可見，已結業課程的學員清單、未結業學員及原因（時間不足／其他）等屬於課程管理層級的資訊，不應暴露給一般學員。需限制此區塊僅供管理員與老師查看。

## What Changes

- 課程詳情頁的「結業資訊」區塊改為僅在當前使用者具備「管理員（admin／superadmin）或老師（teacher_1／teacher_2／teacher_3）」身分時才顯示。
- 一般會員（含已報名該課程的學員）進入已結業課程詳情頁時，不再看到結業資訊區塊。
- 既有「講師資格回饋」入口邏輯不變（仍僅課程建立者可見），但其外層仍受結業資訊區塊的可見性約束。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-graduation-info`: 新增「結業資訊區塊可見性」需求——區塊顯示條件除「課程已結業（`completedAt` 有值）」外，再加上「使用者具管理員或老師身分」；一般會員不顯示。

## Impact

- `app/(user)/course/[id]/page.tsx`：結業資訊區塊的顯示條件加入身分判定。
- `lib/auth-roles.ts`：沿用既有 `canTeachAny(roles)` 判定（管理員或任一書籍講師），不需新增 API。
- session：頁面已取得 `userSession.user.roles`，無額外資料查詢。
- 操作手冊：依異動角色更新 `doc/學員手冊.md`（學員不再見此區塊）與 `doc/老師手冊.md`／`doc/管理者操作手冊.md` 相關章節。
