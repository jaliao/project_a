## Why

學員完成課程結業後，目前系統僅在站內標記結業，未主動通知學員。需在老師確認結業時，自動寄送「結業信」給本次結業的學員，告知結業完成。信件內容應可由管理者在後台維護範本（主旨與內文），並支援動態變數替換。

## What Changes

- **結業時自動寄結業信**：老師於 `graduateCourse` 確認結業後，系統 SHALL 對本次結業（`graduatedAt` 設值）的每位學員寄送結業信；收件地址依 `resolveContactEmail` 規則（優先已驗證通訊 Email）；寄信為 fire-and-forget，不阻塞結業流程。
- **結業信範本後台維護**：於 `/admin/settings` 新增「結業信範本」維護（主旨 + 內文），存於 `AdminSetting`。
- **變數替換**：範本支援 `{{studentName}}`（學員姓名）、`{{courseName}}`（課程／書籍名稱）、`{{graduationDate}}`（結業日期）、`{{spiritId}}`（靈人編號），寄送時以該學員實際值替換。
- 提供合理預設範本（未設定時使用）。

## Capabilities

### New Capabilities
- `graduation-email`: 結業信功能 —— 後台範本維護（主旨／內文／變數）、結業確認時自動寄送給結業學員、變數替換與收件人解析。

### Modified Capabilities
（無；`graduateCourse` 既有結業行為不變，僅新增寄信副作用，於 `graduation-email` capability 描述）

## Impact

- `lib/mailer.ts`：新增 `sendGraduationEmail(to, subject, html)`。
- `lib/utils/`：新增範本變數替換純函式（`{{var}}` → 值）與結業信範本變數定義／預設範本。
- `lib/data/admin-settings.ts`：結業信範本 key 常數（主旨／內文）與預設值。
- `app/actions/admin-settings.ts`：`updateGraduationEmailTemplate(subject, body)`（superadmin）。
- `app/actions/course-invite.ts`：`graduateCourse` 結業後查結業學員（email/commEmail/isCommVerified/顯示名稱/spiritId）＋課程名稱，渲染範本並寄信。
- `app/(user)/admin/settings/`：新增結業信範本維護 UI（主旨 input + 內文 textarea + 變數說明）。
- `config/version.json` patch +1；依 CLAUDE.md 第 9 點更新管理者手冊（範本維護）與老師手冊（結業時自動寄信）。
