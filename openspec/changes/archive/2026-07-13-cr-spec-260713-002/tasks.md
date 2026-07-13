# Tasks — 後台基本設定開放 admin 存取

## 1. Server Actions 權限放寬

- [x] 1.1 `app/actions/admin-settings.ts`：四個 action（`updateHierarchyDepth`、`updateClassMaxCapacity`、`updateRemittanceAccount`、`updateGraduationEmailTemplate`）的 `isSuperadmin` 檢查改為 `canAccessAdmin`，import 同步調整

## 2. UI 移除 superadmin 守衛

- [x] 2.1 `app/[locale]/(admin)/admin/settings/settings-tabs.tsx`：移除 `isSuperadmin` prop、條件分支與「此設定需 superadmin 權限」fallback，基本設定內容直接呈現
- [x] 2.2 `app/[locale]/(admin)/admin/settings/page.tsx`：移除 `isSuperadmin` 計算、`auth()` 呼叫（若僅供此判定）與相關 import，不再傳 `isSuperadmin`
- [x] 2.3 `app/[locale]/(admin)/admin/page.tsx`：後台首頁「系統設定」功能卡 `superadminOnly` 改 `false`，admin 可見入口（手動驗證發現的遺漏）

## 3. 驗證與收尾

- [x] 3.1 `npm run lint` 與 `npm run build` 通過
- [x] 3.2 手動驗證：以 admin（非 superadmin）帳號進入 `/admin/settings` 可見四項設定並可儲存；非管理者呼叫 action 仍被拒
- [x] 3.3 更新 `doc/管理者操作手冊.md`：基本設定各項「⚠️ 僅 superadmin」標註改為管理者皆可（含匯款帳號資訊設定、結業信範本、學習階層深度、班級人數上限等段落），檔首版本與日期更新
- [x] 3.4 `config/version.json` patch +1、`updatedAt` 更新；`README-AI.md` 版本與「已完成」清單更新
