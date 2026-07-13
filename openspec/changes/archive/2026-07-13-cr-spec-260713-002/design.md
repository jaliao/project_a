# Design — 後台基本設定開放 admin 存取

## Context

`/admin/settings` 位於 `(admin)` route group，layout 已保證進入者具 `canAccessAdmin`（admin 或 superadmin）。頁內「基本設定」分頁再以 `isSuperadmin` 二次限縮：`page.tsx` 算出 `isSuperadmin` 傳給 `settings-tabs.tsx`，非 superadmin 顯示「此設定需 superadmin 權限」；`app/actions/admin-settings.ts` 四個 action（`updateHierarchyDepth`、`updateClassMaxCapacity`、`updateRemittanceAccount`、`updateGraduationEmailTemplate`）亦各自檢查 `isSuperadmin`。

「教會代碼維護」「課程目錄管理」分頁與其 actions 用 `canAccessAdmin`，admin 本來就可操作。

## Goals / Non-Goals

**Goals:**
- admin 與 superadmin 對「基本設定」四項設定有相同的檢視與修改權限（UI＋server actions 一致）

**Non-Goals:**
- 不新增角色或細粒度權限模型
- 不動「教會代碼維護」「課程目錄管理」分頁（已開放）
- 不動其他仍需 superadmin 的功能（如角色指派 `app/actions/admin.ts`）

## Decisions

### 1. UI 移除 `isSuperadmin` 分頁守衛，而非改成 `canAccessAdmin` 再判一次

`(admin)/layout.tsx` 已是唯一守衛（CLAUDE.md 第 11 點：後台各頁不得重複轉導判定），頁內再判 `canAccessAdmin` 恆為 true、屬冗餘。故 `settings-tabs.tsx` 刪除 `isSuperadmin` prop 與條件分支（含 fallback 文案），`page.tsx` 移除 `isSuperadmin` 計算與 import。

### 2. Server actions 改用 `canAccessAdmin`

四個 action 的 `isSuperadmin(session?.user?.roles)` 改為 `canAccessAdmin(session?.user?.roles)`。Server action 為獨立入口、不受 layout 保護，權限檢查必須保留（僅放寬層級）。與課程目錄 actions 的既有寫法一致。

### 3. Spec delta 以 cr-spec-260713-001 的版本為基礎

`material-order-payment`「匯款帳號系統設定」requirement 已在未歸檔的 -001 改為多行 textarea 版本；本變更的 MODIFIED block 以該版本為底、僅把 superadmin 情境改為管理者。**歸檔/sync 順序須 -001 在前**，否則 -002 會以舊版覆蓋掉多行文字的需求內容。

## Risks / Trade-offs

- [admin 可改結業信範本與匯款資訊，錯誤設定影響對外信件與繳費] → 此為本變更的目的（授權營運人員維護）；設定頁僅 admin 以上可入，且值有必填/範圍驗證
- [兩個未歸檔變更動到同一 spec requirement] → design 明訂歸檔順序（-001 → -002）；兩者程式碼接觸檔案僅 `settings-tabs.tsx` 重疊（-001 改文案、-002 改守衛結構），實作時已在同一工作樹上依序進行，無衝突

## Open Questions

（無）
