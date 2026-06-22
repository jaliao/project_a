## Context

結業由 `app/actions/course-invite.ts` 的 `graduateCourse(inviteId, lastCourseDate, enrollmentResults)` 處理：在一個 transaction 中為通過學員設 `InviteEnrollment.graduatedAt = lastCourseDate`、未通過者存原因、課程設 `CourseInvite.completedAt`。

寄信基礎建設：`lib/mailer.ts`（Nodemailer/SMTP，函式收 `to/subject/html`）；收件人解析有通用規則 `resolveContactEmail(user)`（`lib/utils/contact-email.ts`，優先已驗證 `commEmail`）。設定以 `AdminSetting`（key-value，`getAdminSetting`/`upsertAdminSetting`）儲存；`/admin/settings` 已有匯款帳號、階層深度等欄位（superadmin 維護）。學員顯示名稱用 `getMemberDisplayName(user)`。

## Goals / Non-Goals

**Goals:**
- 結業確認時，自動對本次結業學員寄結業信。
- 後台維護結業信範本（主旨／內文），支援 4 個變數替換。
- 未設定範本時使用合理預設。

**Non-Goals:**
- 不做手動「重寄」按鈕（依使用者決定：僅結業時自動寄一次）。
- 不寄給未結業學員。
- 不做寄送歷史記錄／重試佇列（fire-and-forget，失敗僅 log）。
- 不串多語系範本。

## Decisions

### 決策 1：範本存 `AdminSetting`，兩個 key
`graduation_email_subject`（主旨）、`graduation_email_body`（內文，純文字段落，寄送時以 `<p>`/換行轉 HTML 或直接當 HTML 內文）。提供預設值常數（`lib/data/admin-settings.ts`）。
- 內文格式：以純文字維護，寄送時將換行轉 `<br>` 包進簡單 HTML（與既有信件風格一致）。避免讓管理者寫 HTML。

### 決策 2：變數替換用純函式 `renderTemplate(tpl, vars)`
`{{key}}` → `vars[key]`，未知變數保留原樣（避免吞字）。支援變數：`studentName`、`courseName`、`graduationDate`、`spiritId`。放 `lib/utils/`（純函式、易測）。
- `graduationDate` 格式化為 `YYYY/MM/DD`（沿用專案日期格式）。

### 決策 3：寄送掛在 `graduateCourse` transaction 之後，fire-and-forget
transaction 成功後，查本次結業學員資料（`id`/`email`/`commEmail`/`isCommVerified`/顯示名稱欄位/`spiritId`）與課程名稱（`CourseInvite.title` 或關聯 `CourseCatalog.label`），逐位渲染範本、以 `resolveContactEmail` 取收件地址、呼叫 `sendGraduationEmail`，`.catch` 記錄錯誤不阻塞。
- 僅對「本次」`graduatedIds`（剛設 graduatedAt 者）寄送，不含先前已結業者。
- 讀範本一次（getAdminSetting）後對多位學員重用。

### 決策 4：收件人沿用 `resolveContactEmail`
與通用規則一致：優先已驗證 `commEmail`，否則帳號 `email`。測試帳號 commEmail 皆為 justin@blockcode.com.tw，結業信測試可集中收取。

### 決策 5：設定 UI 比照既有 superadmin 欄位
`/admin/settings`「基本設定」新增「結業信範本」區塊：主旨 `Input` + 內文 `Textarea` + 可用變數說明；儲存呼叫 `updateGraduationEmailTemplate`。比照 `RemittanceAccountForm` 模式新增元件。

## Risks / Trade-offs

- [SMTP 寄信失敗] → fire-and-forget、`.catch` log，不影響結業；屬 Non-Goal 不做重試。
- [學員無有效 Email] → `resolveContactEmail` 退回帳號 email；名冊學員為合成 email（`{spiritId}@seed...`）寄不到屬預期（測試資料）。
- [範本含未支援變數] → `renderTemplate` 保留原樣，不報錯。
- [大量結業學員逐封寄送] → 單班學員數有限，循序寄送可接受；不引入佇列。

## Migration Plan

無 DB schema 變更（範本存既有 `AdminSetting`）。部署即生效；回滾＝移除寄信呼叫與設定欄位。

## Open Questions

無。
