## 1. 訊息命名空間擴充

- [x] 1.1 `messages/zh-TW.json` 新增 `common`、`nav`、`validation`、`status`、`role`
- [x] 1.2 `messages/en.json` 補對應英文草稿
- [x] 1.3 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`

## 2. 模式 A — Zod 驗證訊息（前台 auth/profile）

- [x] 2.1 `lib/schemas/auth.ts` 驗證訊息改為 `validation.*` key
- [x] 2.2 `lib/schemas/profile.ts` 驗證訊息改為 `validation.*` key
- [x] 2.3 新增共用 `components/ui/field-error.tsx`；遷移 8 個前台表單錯誤呈現與 toast（login/register/forgot/reset/change-password/change-password-card/profile/onboarding）
- [x] 2.4 與後台共用之 schema（course-*）未更動；dead `(user)/profile/profile-form.tsx` 不可達、未動

## 3. 模式 B — enum/標籤（React 顯示）

- [x] 3.1 `components/course-session/course-status-badge.tsx` 改用 `status` 命名空間（轉 client）
- [x] 3.2 書別徽章 `course-catalog-badge` 之 label 為**資料值**（DB 課程目錄名），屬內容非 enum → 不 i18n key 化
- [x] 3.3 保留 `lib/auth-roles.ts` `ROLE_LABELS`（供匯出路由）；前台 role 標籤顯示於其 server 頁批次再遷移

## 4. 共用字串（common/nav）

- [x] 4.1 Topbar 導覽（回首頁/媒合布告欄/後台/個人資料/通知）改 `nav`、品牌改 `common.appName`
- [x] 4.2 跨域共用按鈕等通用詞 `common` 命名空間已建立（feature 專屬元件留後續批）

## 5. 準則與版本

- [x] 5.1 `CLAUDE.md` 第 12 條補子規範（validation key + FieldError；標籤 React i18n／匯出保留 map；漸進遷移全有全無）
- [x] 5.2 `config/version.json` 0.1.102 → 0.1.103；README-AI 當前任務同步

## 6. 驗證

- [x] 6.1 `npm run gen:zh-cn`、`npm run build`（✓ Compiled）、`npm run lint`（0 errors）通過
- [x] 6.2 grep 確認前台已遷移表單無殘留原始 `{errors.x.message}` 顯示（皆走 `<FieldError>`）
- [x] 6.3 課程狀態徽章改 `status` 命名空間（i18n）；en/zh-CN 由訊息目錄供應
- [x] 6.4 後台頁與 Excel 匯出標籤維持繁體（`ROLE_LABELS` map 保留、未顯示原始 key）
- [ ] 6.5 （執行階段，使用者）三語切換抽查共用元件與驗證訊息呈現
