## 1. 資料模型與 migration

- [x] 1.1 `prisma/schema/course-invite.prisma`：`CourseInvite` 新增 `gradRating Int?`（1–5）、`gradTestimony String?`
- [x] 1.2 migration `20260701000000_add_graduation_feedback`（兩個 nullable 欄）＋ `prisma generate`（DB 套用見 6.3）

## 2. Server Action（graduateCourse）

- [x] 2.1 `app/actions/course-invite.ts`：`graduateCourse` 加 `feedback?: { rating?: number | null; testimony?: string | null }`
- [x] 2.2 驗證：`rating` 僅 1–5 否則 null；`testimony` trim 後空存 null（上限 500 字）
- [x] 2.3 於設定 `completedAt` 的同一 `CourseInvite.update` 一併寫入 `gradRating` / `gradTestimony`

## 3. 結業表單（`graduate/graduation-form.tsx`）

- [x] 3.1 「填寫」步驟新增「本次學員整體學習狀況」區：`StarRating`（點同星清除）＋見證 `textarea`（500 上限）；新增 `course.gradForm` i18n keys（en 草稿＋zh-CN OpenCC）
- [x] 3.2 狀態納入表單、送出時傳 `graduateCourse` 第 4 參數；選填、不入 `handleToPreview` 驗證
- [x] 3.3 「預覽」步驟帶出摘要（星等＋見證，未填則略）

## 4. 結業資訊顯示

- [x] 4.1 `lib/data/course-sessions.ts` `getCourseSessionById` select＋`CourseSessionDetail` 型別＋回傳補 `gradRating`、`gradTestimony`
- [x] 4.2 `course/[id]/page.tsx` 結業資訊區塊新增星等（`IconStar/IconStarFilled`）＋見證；**兩者有值才顯示**

## 5. 文件與版本

- [x] 5.1 `doc/老師手冊.md`（結業填寫加五星＋見證、結業資訊顯示）＋ `doc/管理者操作手冊.md`（結業資訊顯示整體回饋）＋檔首版本 v0.1.107；學員手冊不受影響（不外露前台）
- [x] 5.2 `config/version.json` → 0.1.107；README-AI 當前任務同步

## 6. 驗證

- [x] 6.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）、`npm run gen:zh-cn` 通過
- [x] 6.2 （執行階段，需 DB）填/不填五星＋見證皆可結業；結業資訊區依有值顯示；學員前台不可見
- [x] 6.3 （部署）DB 套用 migration：本機 `make prisma-dev-deploy`；VPS3 `make prisma-vps3-deploy`
