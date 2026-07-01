## 1. 全域設定（class_max_capacity）

- [x] 1.1 `app/actions/admin-settings.ts` 新增 `updateClassMaxCapacity(value)`：superadmin、驗證 1–99、`upsertAdminSetting`
- [x] 1.2 `components/admin/class-capacity-form.tsx`（表單）＋系統設定「基本設定」新增區塊
- [x] 1.3 `admin/settings/page.tsx`＋`settings-tabs.tsx`：讀 `class_max_capacity`（`lib/data/admin-settings.ts` 加常數）並傳入

## 2. Schema 放寬

- [x] 2.1 `lib/schemas/course-session.ts`：`courseSessionSchema` 與 `editCourseInfoSchema` 的 `maxCount` 由固定 7 改為防呆硬頂（≤999），下限維持 1

## 3. Server Action 權威驗證

- [x] 3.1 `createCourseSession`：`resolveMaxCapacity`（讀 `class_max_capacity`＋身分）；非管理者 `maxCount<=capacity`
- [x] 3.2 `updateCourseInfo`：同上；`canAccessAdmin` 可超過；維持「不得低於已核准學員數」

## 4. 前台表單上限注入

- [x] 4.1 開課精靈鏈（`user/[spiritId]`→`CourseSessionDialog`→`CreateCourseWizard`→`Step2BasicInfo`）：傳入 `classMaxCapacity`；input `max`／`maxHint({max})` 依之
- [x] 4.2 `edit-course-info-dialog`：`capacity`／`isAdmin` props；input `max`＝管理者 999／否則 capacity；hint：管理者 `maxHintAdmin`、否則 `maxHint({max})`

## 5. 課程詳情編輯入口（管理者）

- [x] 5.1 `course/[id]/page.tsx`：編輯入口 `isInstructor || canAccessAdmin`；讀 `class_max_capacity` 傳入 `capacity`／`isAdmin`

## 6. 文件與版本

- [x] 6.1 `doc/管理者操作手冊.md`（系統設定「班級人數上限」＋開課管理「編輯課程人數覆寫」）；`doc/老師手冊.md`（人數上限依設定）；版本標註
- [x] 6.2 `config/version.json` → 0.1.110；README-AI 同步

## 7. 驗證

- [x] 7.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）、`npm run gen:zh-cn` 通過
- [ ] 7.2 （執行階段）調整設定後開課/編輯上限即時反映；老師超過被擋、管理者可超過；不得低於已核准數；管理者於他人課程可見編輯入口
- [x] 7.3 無 DB migration（`AdminSetting` 既有）；預設 7 時行為同現況
