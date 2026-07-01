## Why

目前結業流程只記錄「最後上課日」與「逐位學員結業/未結業」，缺少老師對**本次整班學習狀況**的整體回饋。希望在結業時讓老師留下「整體學習狀況」的**五星評分**與**見證**（文字），作為事工紀錄與後續參考，並於結業資訊中呈現。

## What Changes

- 結業表單（`graduation-form`）新增「本次學員整體學習狀況」區段：**五星評分**（1–5）＋**見證**文字區塊。兩者**皆選填**，留空不阻擋結業送出。
- `graduateCourse` 接收並寫入班級層級的 `gradRating` / `gradTestimony`（一張課程一則）。
- 課程詳情「結業資訊」區塊（沿用 `canViewGraduation`：管理者＋老師可見）顯示老師填寫的五星與見證。
- `CourseInvite` 新增 `gradRating Int?`、`gradTestimony String?` 兩欄（migration，非破壞性）。

## Capabilities

### New Capabilities

（無——擴充既有結業能力）

### Modified Capabilities

- `course-graduation`: 結業流程於送出時可一併記錄班級層級的整體學習狀況（五星評分＋見證，皆選填）。
- `course-graduation-info`: 結業資訊區塊（管理者＋老師可見）新增呈現老師填寫的五星評分與見證。

## Impact

- `prisma/schema/course-invite.prisma`（`CourseInvite` +`gradRating Int?` +`gradTestimony String?` → migration）
- `app/[locale]/(user)/course/[id]/graduate/graduation-form.tsx`（填寫步驟加五星選擇器＋見證 textarea；預覽帶出）
- `app/actions/course-invite.ts`（`graduateCourse` 參數與寫入；型別）
- `app/[locale]/(user)/course/[id]/page.tsx`（結業資訊區塊顯示五星＋見證）＋ `lib/data/course-sessions.ts`（結業相關 select 補欄）
- `doc/管理者操作手冊.md`、`doc/老師手冊.md`（結業流程新增欄位說明）
- 老師前台表單字串維持繁體（非 i18n 範圍）
