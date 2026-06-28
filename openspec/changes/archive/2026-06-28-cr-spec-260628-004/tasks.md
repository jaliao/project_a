## 1. 驗證 Schema

- [x] 1.1 `lib/schemas/course-session.ts`：`courseSessionSchema.maxCount` 加上限 7（1–7）
- [x] 1.2 `lib/schemas/course-invite.ts`：`createInviteSchema.maxCount` 加上限 7（1–7）
- [x] 1.3 新增 `editCourseInfoSchema`（title / maxCount(1–7) / expiredAt / courseDate / notes；expiredAt 不早於今天）

## 2. Server Action

- [x] 2.1 新增 `updateCourseInfo(inviteId, input)`（`app/actions/course-session.ts`）：登入 + 取 createdById/狀態旗標/approved 學員數
- [x] 2.2 守衛：擁有者或管理者；課程須招生中（startedAt/cancelledAt/completedAt 皆 null，否則拒絕）
- [x] 2.3 驗證：`editCourseInfoSchema` + `maxCount >= approved 學員數`（否則回傳具體原因）；更新並 `revalidatePath`

## 3. UI（編輯）

- [x] 3.1 新增 `components/course-session/edit-course-info-dialog.tsx`（RHF + zodResolver；名稱/人數/截止日/開課日/備註）
- [x] 3.2 人數欄位旁顯示提醒「每班最多 7 人」
- [x] 3.3 `app/(user)/course/[id]/page.tsx`：招生中且為擁有者/管理者時顯示「編輯課程資訊」入口，傳入現值與 approved 學員數

## 4. UI（建立階段提醒與上限）

- [x] 4.1 `components/course-session/create-course-wizard/step-2-basic-info.tsx`：人數欄位加「每班最多 7 人」提醒（上限由 schema 強制）
- [x] 4.2 `components/course-invite/create-invite-form.tsx`：人數欄位加「每班最多 7 人」提醒

## 5. 驗證

- [x] 5.1 `npm run build` 通過
- [x] 5.2 手動驗證：招生中可編輯、非招生中無入口且 action 拒絕；非擁有者拒絕
- [x] 5.3 手動驗證：maxCount >7 拒絕、< approved 拒絕、合法值成功
- [x] 5.4 手動驗證：新增授課兩條路徑皆套用 7 上限與提醒

## 6. 文件與版本

- [x] 6.1 `doc/老師手冊.md`：補上「招生階段編輯課程資訊」與人數規則（最多 7、不可低於已核准）；更新檔首版本與日期
- [x] 6.2 `config/version.json` patch +1
- [x] 6.3 更新 `README-AI.md`（updateCourseInfo、maxCount 1–7 規則）
