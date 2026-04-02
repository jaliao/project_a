## Context

目前 `User` 無教會/單位欄位，`CourseOrder.churchOrg` 是每次訂購時手動輸入的自由文字，兩者互相獨立。本 CR 建立集中管理的 `Church` 清單，讓會員在個人資料中選擇所屬單位，作為系統中教會歸屬的唯一來源。

現有個人資料頁（`/profile`）使用 `ProfileForm` Client Component 處理表單，`app/actions/` 有對應 Server Action。

## Goals / Non-Goals

**Goals:**
- 建立 `Church` 資料表與後台 CRUD
- `User` 新增 `churchId`（外鍵）與 `churchOther`（自填文字）兩欄，以 `churchType` enum 區分三種狀態
- 個人資料頁整合選擇 UI
- Seed 預設四個教會

**Non-Goals:**
- 不連動 `CourseOrder.churchOrg`（保持獨立，不自動帶入）
- 不支援會員自行新增教會（只能選清單或填「其他」）
- 不支援多教會（一個會員只屬一個單位）

## Decisions

### 1. churchType enum vs nullable churchId 判斷

**選擇**：用 `ChurchType` enum（`church` | `other` | `none`）+ `churchId?`（外鍵） + `churchOther?`（文字）三欄組合表示狀態。

**理由**：僅靠 `churchId IS NULL` 無法區分「未選」、「無」、「其他」三種語意。enum 讓業務邏輯清晰，不需要魔法值。

**狀態對應：**
| churchType | churchId | churchOther | 語意 |
|---|---|---|---|
| `church` | 有值 | null | 選清單中的教會 |
| `other` | null | 有值 | 自填其他 |
| `none` | null | null | 無 / 不填 |

初始狀態（未曾填寫）視為 `none`，DB 欄位均為 null，`churchType` 預設 `none`。

### 2. 後台 CRUD 架構

**選擇**：`/admin/churches` 為 Server Component 頁面，編輯使用 inline 表單或 Dialog（同課程目錄 `/admin/course-catalog` 的模式）。

**理由**：與現有管理頁保持一致，不引入新架構。

### 3. sortOrder 管理

**選擇**：後台可手動設定 `sortOrder`（整數），清單依 `sortOrder ASC, id ASC` 排序。Seed 資料依需求順序指定固定 sortOrder。

**理由**：教會清單無需拖曳排序，手動填寫 sortOrder 已足夠。

### 4. 停用教會的處理

**選擇**：已選擇「停用教會」的會員，個人資料仍保留關聯（不清空），但下拉清單只顯示 `isActive = true` 的選項，加上「已停用」提示。

**理由**：避免停用教會後會員資料靜默清空，保留歷史關聯。

## Risks / Trade-offs

- **[User 現有資料無 churchType]** → 欄位預設 `none`，舊資料遷移後狀態為「無」，符合預期
- **[Church 被刪除時 User.churchId 懸空]** → 設定 `onDelete: SetNull`，刪除教會時自動清空關聯並將 `churchType` 留給應用層在下次儲存時修正；或限制「有會員關聯時不可刪除」（選後者更安全）
- **[churchOther 自由文字品質]** → 無法強制標準化，接受此取捨

## Migration Plan

1. 新增 `church.prisma`（Church model + ChurchType enum）
2. `user.prisma` 新增 `churchType`（預設 `none`）、`churchId?`、`churchOther?`
3. `make schema-update name=add_church`
4. `seed.ts` 新增 Church 初始資料（101、心欣、Kua、全福會）
5. 實作 data layer、actions、後台 CRUD 頁、個人資料表單整合
6. 後台會員詳情頁補顯示

**Rollback**：Church 為全新表，`User` 新增可空欄位，migration 可 revert 而不影響現有資料。
