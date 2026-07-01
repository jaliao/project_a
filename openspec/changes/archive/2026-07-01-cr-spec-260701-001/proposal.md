## Why

目前「每班最多 7 人」是寫死在共用 zod（`lib/schemas/course-session.ts`）的硬上限，開課與編輯課程皆受限、且無法調整。實務上班級人數上限可能需要調整，且管理者對特定班級應能彈性放寬。需讓管理者於後台設定全域上限，並允許管理者對個別班級覆寫（超過上限）。

## What Changes

- **全域上限設定**：新增 `AdminSetting` key `class_max_capacity`（預設 `7`），於後台「系統設定 → 基本設定」維護。
- **上限改讀設定值（套用全體）**：開課精靈與編輯課程的人數上限（input `max`＋提示文字＋驗證）改依 `class_max_capacity` 而非固定 7；老師端一併套用。
- **管理者覆寫**：`createCourseSession` / `updateCourseInfo` 於操作者為管理者時放寬上限（可超過 `class_max_capacity`）；課程詳情的「編輯課程資訊」對話框**同時對管理者顯示**（目前僅課程建立者可見），使管理者能調整該班 `maxCount`。
- 仍保留「`maxCount` 不得低於已核准學員數」限制。
- 共用 zod 的 `.max(7)` 改為寬鬆硬頂（防呆上界），實際上限於 server action 依設定值＋操作者身分驗證。

## Capabilities

### New Capabilities

- `admin-class-capacity-setting`: 後台系統設定新增「班級人數上限」（`class_max_capacity`，預設 7），供管理者調整全域上限。

### Modified Capabilities

- `create-course-session`: 開課人數上限改讀 `class_max_capacity`（取代固定 7）。
- `course-info-edit`: 編輯課程人數上限改讀 `class_max_capacity`；管理者可超過上限並可於課程詳情編輯該班人數。

## Impact

- `lib/schemas/course-session.ts`（放寬 `.max(7)` 為寬鬆硬頂；實際上限移至 server 驗證）
- `app/actions/course-session.ts`（`createCourseSession` / `updateCourseInfo`：讀 `class_max_capacity`＋管理者放寬）
- `components/course-session/create-course-wizard/step-2-basic-info.tsx`、`components/course-session/edit-course-info-dialog.tsx`（input `max`／提示文字改讀設定值；管理者放寬）
- `app/[locale]/(user)/course/[id]/page.tsx`（編輯對話框對管理者顯示）
- 系統設定：`app/[locale]/(admin)/admin/settings/*` ＋ `components/admin/*`（新增「班級人數上限」表單，`lib/data/admin-settings.ts` set）
- `doc/管理者操作手冊.md`、`config/version.json`、README-AI
- 無 DB migration（`AdminSetting` 已存在）；純後台設定＋既有前台表單，繁體
