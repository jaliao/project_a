## Why

系統目前缺乏結構化的課程定義，CourseInvite 的課程名稱為自由輸入文字，無法約束課程類型、控制開放狀態或驗證先修資格。同時學員與教師都沒有地方查閱自己的學習與授課歷程。

## What Changes

- 新增課程目錄定義（啟動靈人 1～4），僅 1、2 可開課與報名，3、4 暫不開放
- 建立邀請時改為從課程目錄選擇課程（啟動靈人 1 或 2），不再自由輸入
- 學員透過邀請連結加入 啟動靈人 2 課程前，系統驗證其是否已完成 啟動靈人 1
- 新增「學習紀錄」頁面，顯示當前使用者的已完成學習（學員）與已完成授課（教師）紀錄

## Capabilities

### New Capabilities
- `course-catalog`: 課程目錄定義（啟動靈人 1～4、開放狀態、先修條件）
- `course-prerequisite`: 加入邀請時驗證先修課程完成狀態
- `learning-records`: 學習紀錄頁面（已學習 / 已授課）

### Modified Capabilities
（無現有 spec 需異動）

## Impact

- `config/course-catalog.ts` — 新增課程目錄設定（config-driven，含 level、label、isActive、prerequisiteLevel）
- `prisma/schema/course-invite.prisma` — `CourseInvite` 新增 `courseLevel CourseLevel` enum 欄位
- `prisma/schema/user.prisma` — 無異動（學習紀錄透過現有 InviteEnrollment / CourseInvite 查詢）
- `lib/schemas/course-invite.ts` — createInviteSchema 將 title 改為從 courseLevel 選擇
- `app/actions/course-invite.ts` — 新增 `getUserLearningLevel()`；`joinInvite` 驗證學員先修；`createInvite` 驗證教師先修（需已完成該等級課程）並以 courseLevel label 作為 title；新增 `getMyLearningRecords()`
- `components/course-invite/create-invite-form.tsx` — 課程選擇改為 CourseLevel Select（僅顯示 isActive 課程）
- `app/(user)/learning/page.tsx` — 新增學習紀錄頁面（Server Component）
- `app/(user)/dashboard/page.tsx` — 新增「學習紀錄」快速連結
- 需一次 Prisma migration（add_course_level_to_invite）
