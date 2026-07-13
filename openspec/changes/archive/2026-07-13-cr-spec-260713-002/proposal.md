# 後台基本設定開放 admin 存取（cr-spec-260713-002）

## Why

後台系統設定（`/admin/settings`）的「基本設定」分頁目前僅 superadmin 可檢視與修改，一般管理者（admin）進入只看到「此設定需 superadmin 權限」，無法維護日常營運所需的設定（如教材匯款帳號資訊、結業信範本）。管理者需要能自行設定。

## What Changes

- 「基本設定」分頁的**四個設定項全部開放給 admin**（與 superadmin 相同權限）：
  - 學習階層展開深度（`hierarchy_depth`）
  - 班級人數上限（`class_max_capacity`）
  - 教材匯款帳號資訊（`remittance_account`）
  - 結業信範本（`graduation_email_subject` / `graduation_email_body`）
- **UI**：`settings-tabs.tsx` 移除 `isSuperadmin` 分頁守衛（`(admin)/layout.tsx` 已保證進入者為 admin/superadmin）；`page.tsx` 不再傳 `isSuperadmin`
- **Server Actions**：`app/actions/admin-settings.ts` 四個 action 的權限檢查由 `isSuperadmin` 改為 `canAccessAdmin`
- 「教會代碼維護」「課程目錄管理」分頁本來就開放 admin，不變

## Capabilities

### New Capabilities

- `admin-settings-access`: 後台系統設定「基本設定」分頁的存取權限規則——admin 與 superadmin 皆可檢視與修改四項設定，對應 server actions 以 `canAccessAdmin` 驗證

### Modified Capabilities

- `graduation-email`: 結業信範本維護由「僅 superadmin 可編輯」改為「管理者（admin/superadmin）可編輯」
- `material-order-payment`: 匯款帳號資訊系統設定的更新情境由 superadmin 改為管理者（admin/superadmin）

## Impact

- **UI**：`app/[locale]/(admin)/admin/settings/settings-tabs.tsx`、`page.tsx`
- **Server Actions**：`app/actions/admin-settings.ts`（4 個 action：`updateHierarchyDepth`、`updateClassMaxCapacity`、`updateRemittanceAccount`、`updateGraduationEmailTemplate`）
- **specs**：`admin-class-capacity-setting` 原文即寫「具設定權限的管理者」，不需 delta
- **⚠️ 變更相依**：`material-order-payment` 的「匯款帳號系統設定」requirement 已在未歸檔的 `cr-spec-260713-001` 修改（多行 textarea）；本變更的 delta 以該版本為基礎，**歸檔/sync 順序須 -001 在前**
- **手冊**：`doc/管理者操作手冊.md` 多處「⚠️ 僅 superadmin」標註需改為 admin 皆可；`config/version.json` patch +1
- **資料庫**：無 migration
