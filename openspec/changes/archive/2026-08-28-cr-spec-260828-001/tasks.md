## 1. 標籤文案調整

- [x] 1.1 `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`：將第 190 行 `<label ...>真實姓名 *</label>` 的文字改為「中文姓名（若無中文姓名請填上您護照上的拼音姓名） *」（保留 `*` 必填標記，className 不動）
- [x] 1.2 ~~`messages/zh-TW.json`：`profile.realName`~~ **不適用**：實作時查證 `messages/*.json` 並無 `profile` 命名空間或 `profile.realName` 鍵；唯一的 `realName` 訊息鍵為 `onboarding.realName`（onboarding 精靈用，需求範圍外）與 `validation.realNameRequired`/`realNameEnter`（驗證訊息，文字未變）。個人資料頁標籤為寫死字串，改字串即生效，無 i18n 鍵需同步。
- [x] 1.3 ~~`messages/en.json`：`profile.realName`~~ **不適用**：同 1.2，無此鍵。
- [x] 1.4 `app/[locale]/(user)/profile/profile-form.tsx`（舊死碼檔）同一標籤一併改為相同文字，保持一致

## 2. 驗證

- [x] 2.1 `npm run lint` — 0 errors（16 個既有 warning 與本次變更無關）
- [x] 2.2 `npm run build` — `✓ Compiled successfully`、靜態頁 98/98 產生成功（prebuild `gen:zh-cn` 一併通過）
- [x] 2.3 無瀏覽器自動化工具，改以程式碼確認：`profile-form.tsx:190` 標籤字串已更新、`*` 必填標記保留
- [x] 2.4 無瀏覽器自動化工具，改以 schema 確認：`lib/schemas/profile.ts` `realName: z.string().min(1, 'validation.realNameRequired')` 未變動，必填規則不受影響
- [x] 2.5 已確認：`onboarding-wizard.tsx` 仍為 `t('onboarding.realName')`、`messages/zh-TW.json` `onboarding.realName` = 「真實姓名」未動

## 3. 文件與版本號同步

- [x] 3.1 `doc/學員手冊.md`：第 95、104、262 行（個人資料頁情境）改為「中文姓名…」字樣；第 82 行為 onboarding Step 2 描述、onboarding UI 未改故維持「真實姓名」；檔首版本標註更新為 v0.1.172（2026-08-28）
- [x] 3.2 `doc/管理者操作手冊.md`：逐條確認「真實姓名」出現處（證書製作、人名搜尋、隱私說明、後台補填狀態指標）皆非個人資料頁標籤本身，維持不變、不 bump 版本
- [x] 3.3 `config/version.json`：`0.1.171` → `0.1.172`，`updatedAt` → `2026-08-28`
