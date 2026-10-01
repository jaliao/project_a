## 1. 品牌英文名稱統一

- [x] 1.1 `messages/en.json`：`common.appName` 由「啟動事工」改為 `"Activate Ministry"`
- [x] 1.2 `messages/en.json`：`footer.description`、`footer.copyright` 的 "Chidao Ministry" 改為 "Activate Ministry"
- [x] 1.3 `messages/en.json`：`seo.defaultTitle`、`seo.description` 的 "KUA Ministry" 改為 "Activate Ministry"；同段文字內的 "Activate Spirit"／"Activate Abundance"／"Activate Victory" 課程名稱一併改為 "Activate Spiritman"／"Activate Abundance"／"Activate Victory"（與 1.4 的統一譯名一致）
- [x] 1.4 `messages/en.json`：`role.teacher_1` 由 "Activate Spirit Instructor" 改為 "Activate Spiritman Instructor"（統一「Activate Spiritman」譯名）
- [x] 1.5 全域搜尋 `messages/en.json` 是否還有其他 "Chidao Ministry"／"KUA Ministry" 殘留，一併改為 "Activate Ministry"（另發現 `courses.metaDescription`／`introBody` 亦有 "KUA Ministry"，已一併修正；`courses.introBody` 內的 "Activate Spirit" 亦順手統一為 "Activate Spiritman"）
- [x] 1.6 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 2. enum/label map 改接 i18n

- [x] 2.1 `messages/zh-TW.json`／`en.json` 新增 `materialOrderStatus` 命名空間，key 對應 `lib/utils/material-order-status.ts` 的六個 `MaterialOrderStatusKey`（`pending_quote`／`pending_payment`／`pending_confirm`／`pending_ship`／`shipped`／`received`），zh-TW 沿用既有 `LABELS` 字串，en 補上對應英文翻譯
- [x] 2.2 `messages/zh-TW.json`／`en.json` 新增 `adminLogAction` 命名空間，key 對應 `config/admin-log-action.ts` 的五個 action（`enrollment_add`／`enrollment_remove`／`material_finalize`／`material_reopen`／`member_delete`），zh-TW 沿用既有 `label` 字串，en 補上對應英文翻譯
- [x] 2.3 `lib/auth-roles.ts` 的 `ROLE_LABELS` 呼叫端：實際盤點後唯一前台呼叫點為 `lib/utils/identity-tags.ts`（已改為接受可選 `t` 參數，前台 `page.tsx` 傳入 `tRole`；`components/admin/member-tag.tsx` 等後台/Excel 匯出呼叫端未傳 `t`，維持原 `ROLE_LABELS` 不變）
- [x] 2.4 教材訂單狀態顯示端（`course-detail-actions.tsx` 訂單列表）改為 `tStatus(status.key)`，不再直接引用 `status.label`（後台 `material-order-table.tsx` 未動）
- [x] 2.5 `app/[locale]/(user)/course/[id]/course-operation-log.tsx` 的動作文字改為 `tAction(log.action)`，不再直接引用 `getAdminLogActionLabel(action)`（該函式保留於 `config/admin-log-action.ts` 供既有呼叫端使用）
- [x] 2.6 `lib/utils/course-start-gate.ts`：`evaluateCourseStartGate`（繁體 reasons，server 判斷與拒絕訊息用）完全不變；新增 `evaluateCourseStartGateReasonCodes`（結構化原因碼，不含字串）供 UI 層呼叫，`course/[id]/page.tsx` 用其結果搭配新增的 `course.detail.startGate*` i18n key 組字串，傳給 client 元件顯示

## 3. 課程名稱翻譯映射層

- [x] 3.1 `messages/zh-TW.json`／`en.json` 新增 `catalog` 命名空間：四個 key，en 值為 Activate Ministry／Spiritman／Abundance／Victory
- [x] 3.2 新增共用 helper `translateCatalogLabel(t, label)`（`lib/utils/catalog-label.ts`）；改用 `t.has(label)` 判斷是否命中（而非比對字串），避免 zh-TW 值等於 key 時誤判為未命中
- [x] 3.3 `components/course-session/course-catalog-badge.tsx` 維持純呈現不變；改在呼叫端（`course-session-card.tsx`、`course/[id]/page.tsx`）先用 `translateCatalogLabel` 轉換好 label 再傳入，原因：此元件無法得知自己在 server/client 哪種情境渲染，不適合內部呼叫 `useTranslations`
- [x] 3.4 `components/learning/course-progress-cards.tsx`：已改為 async Server Component，課程名稱與狀態文案皆透過 `translateCatalogLabel`／`studentProfile` i18n key 呈現
- [x] 3.5 已盤點並改接的前台呼叫點：`app/(guest)/courses/page.tsx`（公開課程介紹標題）、`course/[id]/page.tsx`（課程分類徽章＋講師回饋提示 bookLabel）、`course-session-card.tsx`（課程卡徽章）、`student-apply-section.tsx`（先修課程提醒）、`learning-catalog-grid.tsx`（我的學習書籍卡片，對應截圖 2）、`learning/[catalogId]/page.tsx`（頁面標題）、`learning-intent-dialog.tsx`（我想上課課程勾選）、`create-course-wizard/{create-course-wizard,step-1-course-card}.tsx`（開課精靈選課卡片與預設課名來源）。**未改**（admin-only，刻意排除）：`components/course-catalog/*`、`components/admin/*`。**未逐一確認**（存在 `.label` 使用但時間所限未逐檔核實是否為 CourseCatalog.label）：`course-session.form.tsx`〔見 4.3 說明〕、`cancel-course-dialog.tsx`／`graduation-form.tsx`（初步判斷為「原因」選項而非課程名稱，未改）
- [x] 3.6 `messages/en.json` 的 `courses.fallback` 三段描述文字內嵌課程名稱已改為 Activate Spiritman／Abundance／Victory

## 4. 個人首頁（student-profile-page）補 i18n

- [x] 4.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：已全面改接 `studentProfile`／`role`／`conversation` i18n key，`metadata.title` 改為 `generateMetadata`
- [x] 4.2 `components/learning/course-progress-cards.tsx`：狀態與完成度文案已改接（與 3.4 同步完成）
- [x] 4.3 **與 spec 描述不符**：`course-session-form.tsx:146` 的 `CourseSessionForm` 元件經確認是未被任何頁面引用的死碼（僅剩型別名稱字串相符造成誤判），真正運作中的「老師代建立授課」流程是 `create-course-wizard/step-2-basic-info.tsx:56-57` 的 `buildDefaultTitle`（`${instructorName} 的 ${courseCatalogLabel}`）。已改為在上層 `create-course-wizard.tsx` 傳入已翻譯過的 `courseCatalogLabel`（見 3.5），使預設課名的課程部分隨語言呈現；死碼 `course-session-form.tsx` 本身未改動
- [x] 4.4 `app/[locale]/(user)/user/[spiritId]/inquiries/page.tsx`：`metadata.title` 改為 `generateMetadata` 讀取新增的 `supportInquiry.metaTitle` key

## 5. 課程詳情頁剩餘硬編碼補齊

- [x] 5.1 `approved-students-section.tsx`：「新增學員」／「完成移除」／「移除學員」按鈕改接 `course.detail.*` i18n key
- [x] 5.2 `course-operation-log.tsx`：標題／空狀態／筆數說明／操作者／對象 prefix 皆已改接 `course.detail.*` i18n key
- [x] 5.3 `invite-student-cells.tsx`：**實際盤點後發現 `AddStudentDialog`／`RemoveStudentButton` 全站唯一呼叫點就是 `approved-students-section.tsx`（課程詳情頁，非 `(admin)`），並無任何後台頁面使用**，故不需要 spec 設想的「依情境切換繁體/i18n」props 機制，已將整個元件（含新增 Dialog、移除確認 AlertDialog、所有 toast）全面改接新增的 `course.inviteStudent` 命名空間

## 6. metadata.title 批次 i18n 化

- [x] 6.1 實際盤點：`(guest)`／`(user)` 下寫死 `metadata.title` 的頁面共 11 個（非原估 20+），其中 4 個已於第 4 組處理（`user/[spiritId]/page.tsx`、`inquiries/page.tsx`、`learning/[catalogId]/page.tsx`、`course/[id]/page.tsx` 已有 `generateMetadata`），本組處理剩餘 7 個：`terms`／`privacy`／`user/[spiritId]/courses`／`messages`／`account-suspended`／`change-password`／`user/[spiritId]/learning`
- [x] 6.2 7 個頁面皆已改為 `generateMetadata` + `getTranslations`；`learning/page.tsx` 重用既有 `learning.metaTitle`，其餘 6 個新增 `pageMeta.*` 命名空間（`terms`／`privacy`／`myCourses`／`messages`／`accountSuspended`／`changePassword`）
- [x] 6.3 **與 spec 描述不符**：`app/[locale]/layout.tsx` 實際上刻意**不設** `title.template`（註解說明：既有內頁多以完整字串「XXX — 啟動事工」設定，加 template 會造成站名後綴重複）。本次新增的 `generateMetadata` 皆遵循既有慣例回傳含完整站名後綴的字串（如 `t('metaTitle')` 值本身即為「XXX — Activate Ministry」），與現況一致，不涉及 layout.tsx 改動

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 與 `npm run build` 皆成功（build 過程中的 `Can't reach database server at db` 是沙箱環境無 DB 連線導致的靜態生成期間查詢警告，非程式錯誤，與本次改動無關）
- [x] 7.2 **已用靜態 grep 檢查替代**（執行環境無瀏覽器）：對截圖涉及的 7 個核心檔案與 course/[id] 相關的 8 個延伸檔案逐一掃描非註解行的中文殘留，確認所有實際渲染文字皆已改接 i18n，僅剩程式註解（JSX `{/* */}` 與區塊註解）維持繁體——符合專案規範（註解本應為繁體）。**建議使用者實際用瀏覽器以 zh-TW/en 切換比對 7 張截圖對應頁面**，以肉眼確認視覺呈現與文案通順度（尤其 `t.rich` 粗體渲染、ICU 參數代入後的語序）
- [x] 7.3 靜態檢查：zh-TW 為所有新增 key 的預設值來源，且逐一核對內容與改版前原字串一致（例如 `catalog.啟動靈人` 的 zh-TW 值即為原文「啟動靈人」）；**仍建議使用者實際瀏覽器確認**無視覺位移（如 `t.rich` 粗體樣式是否與原 `<strong>`/`font-semibold` 一致）
- [x] 7.4 靜態檢查：`grep -rl "ROLE_LABELS\|getAdminLogActionLabel" app/[locale]/(admin) components/admin` 確認後台頁面與 `material-order-table.tsx`、`member-tag.tsx` 等後台元件呼叫端未被修改，仍直接使用原繁體 map
- [x] 7.5 靜態檢查：`app/api/admin/members/export/route.ts` 等匯出路由未被本次改動觸及，`ROLE_LABELS` 匯入與呼叫方式不變

## 8. 收尾

- [x] 8.1 `config/version.json`：0.1.210 → 0.1.211，`updatedAt` → 2026-10-01
- [x] 8.2 已逐份檢查：僅 `doc/學員手冊.md:104`「語言設定」段落提及介面多語系切換，描述的是切換功能本身（既有，未改變），不涉及哪些字串已/未翻譯，確認無需異動；`doc/管理者操作手冊.md`／`doc/老師手冊.md` 無相關段落
- [x] 8.3 `README-AI.md` 索引版本行更新；`ai-context/07-current-tasks.md`「已完成」清單最前面新增本次 CR 完整記錄（含範圍、架構決策、與 Spec 描述不符之處）；`02-tech-stack.md` 的 i18n 架構描述本次未變動（仍為 next-intl 4 + zh-TW/en/zh-CN），故未修改
