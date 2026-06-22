## 1. 範本變數替換 util

- [x] 1.1 新增 `lib/utils/render-template.ts`：`renderTemplate(tpl, vars)` —— `{{key}}` → `vars[key]`，未知變數原樣保留（純函式）

## 2. 範本設定（資料層 + action）

- [x] 2.1 `lib/data/admin-settings.ts`：新增結業信範本 key 常數 `GRADUATION_EMAIL_SUBJECT_KEY`、`GRADUATION_EMAIL_BODY_KEY` 與預設主旨／內文（含 `{{studentName}}` 等變數）
- [x] 2.2 `app/actions/admin-settings.ts`：新增 `updateGraduationEmailTemplate(subject, body)`（superadmin，主旨／內文非空驗證，upsert 兩個 key）

## 3. 寄信函式

- [x] 3.1 `lib/mailer.ts`：新增 `sendGraduationEmail(to, subject, html)`（沿用既有 transporter／FROM）

## 4. 結業時自動寄送

- [x] 4.1 `app/actions/course-invite.ts` `graduateCourse`：transaction 成功後，查本次 `graduatedIds` 學員（`email`/`commEmail`/`isCommVerified`/顯示名稱欄位/`spiritId`）與課程名稱
- [x] 4.2 讀範本（`getAdminSetting` 主旨／內文，預設 fallback），逐位 `renderTemplate` 替換變數（`graduationDate` 格式 `YYYY/MM/DD`），內文換行轉 HTML
- [x] 4.3 以 `resolveContactEmail(user)` 取收件地址，呼叫 `sendGraduationEmail`，fire-and-forget（`.catch` log，不阻塞結業）

## 5. 設定 UI

- [x] 5.1 新增 `components/admin/graduation-email-form.tsx`（主旨 `Input` + 內文 `Textarea` + 可用變數說明）→ `updateGraduationEmailTemplate`
- [x] 5.2 `/admin/settings`「基本設定」加入結業信範本區塊；page 讀取現有範本傳入（superadmin only）

## 6. 驗證

- [x] 6.1 `npm run build` 通過（tsc 無錯誤）
- [x] 6.2 端到端：維護範本 → 老師結業勾選學員 → 結業學員收到結業信（測試帳號集中至 justin@blockcode.com.tw），變數正確替換
  - ⚠️ 2026-06-22 初次實機**沒收到信**：根因為當初 apply 時 `graduateCourse`（`app/actions/course-invite.ts`）的寄信區塊**未實際寫入**（被偽造、未落地的編輯）。已補上並改為 `await`（結業 commit 後寄送，失敗不影響結業）。✅ 2026-06-22 使用者重新實機確認**已收到結業信**。
- [x] 6.3 邊界：未勾選學員不寄；未設定範本用預設；寄信失敗不影響結業；未知變數原樣保留（程式邏輯保證；happy path 已實機確認）

## 7. 收尾

- [x] 7.1 依 CLAUDE.md 第 9 點更新 `doc/管理者操作手冊.md`（結業信範本維護）與 `doc/老師手冊.md`（結業時自動寄結業信），更新檔首版本與日期
- [x] 7.2 apply 時將 `config/version.json` patch 版本號 +1
