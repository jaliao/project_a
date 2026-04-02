## 1. 資料庫 Schema

- [x] 1.1 新增 `prisma/schema/church.prisma`，定義 `ChurchType` enum（`church` | `other` | `none`）與 `Church` model（`id`、`name String @unique`、`isActive Boolean @default(true)`、`sortOrder Int @default(0)`、`users User[]`）
- [x] 1.2 更新 `prisma/schema/user.prisma`，新增 `churchType ChurchType @default(none)`、`churchId Int?`、`churchOther String?`、關聯 `church Church?`（`@relation(fields: [churchId], references: [id], onDelete: SetNull)`）
- [x] 1.3 執行 `make schema-update name=add_church` 建立遷移並重新生成 client

## 2. Seed 資料

- [x] 2.1 更新 `prisma/seed.ts`，新增四個預設教會 upsert（by name）：101（sortOrder=1）、心欣（sortOrder=2）、Kua（sortOrder=3）、全福會（sortOrder=4），執行後輸出清單

## 3. Data Layer

- [x] 3.1 新增 `lib/data/churches.ts`，實作：
  - `getActiveChurches()` — 取得 `isActive = true` 的教會清單（依 sortOrder ASC, id ASC）
  - `getAllChurches()` — 取得所有教會含停用（後台用）
  - `getChurchMemberCount(churchId)` — 計算關聯會員數
  - `createChurch(name, sortOrder?)` — 新增教會
  - `updateChurch(id, data)` — 更新名稱/sortOrder
  - `toggleChurchActive(id)` — 切換啟用狀態
  - `deleteChurch(id)` — 刪除（有關聯時拋出錯誤）

## 4. Server Actions

- [x] 4.1 新增 `app/actions/church.ts`，實作：
  - `createChurchAction(name, sortOrder?)` — 新增（驗證名稱非空）
  - `updateChurchAction(id, name, sortOrder)` — 更新
  - `toggleChurchActiveAction(id)` — 切換啟用
  - `deleteChurchAction(id)` — 刪除（有關聯時回傳錯誤訊息）
  - 全部 revalidatePath('/admin/churches')，需 admin/superadmin 角色

## 5. 後台教會管理頁

- [x] 5.1 新增 `app/(user)/admin/churches/page.tsx`（Server Component）：顯示教會清單（名稱、狀態 Badge、會員數）、新增教會 inline 表單
- [x] 5.2 新增 `components/admin/church-list.tsx`（Client Component）：每列顯示教會資料、啟用/停用切換按鈕、編輯按鈕（展開 inline 表單）、刪除按鈕（AlertDialog 確認）

## 6. 個人資料頁整合

- [x] 6.1 更新 `app/(user)/profile/page.tsx`：查詢時加入 `church` 關聯（`include: { church: true }`），將 `churchType`、`churchId`、`churchOther`、`church`、以及 `activeChurches`（從 `getActiveChurches()` 取得）傳入 ProfileForm
- [x] 6.2 更新 `app/(user)/profile/profile-form.tsx`（或對應 Client Component）：新增所屬教會欄位——`Select` 下拉（無/教會清單/其他），選「其他」時顯示 `Input` 文字欄位；已停用的現有關聯教會以「（已停用）」標記呈現
- [x] 6.3 更新對應的 Zod schema（`lib/schemas/`）：新增 `churchType`、`churchId?`、`churchOther?` 欄位驗證（選 `other` 時 `churchOther` 必填）
- [x] 6.4 更新 profile Server Action（`app/actions/` 對應檔案）：處理 `churchType/churchId/churchOther` 儲存邏輯

## 7. 後台會員詳情頁

- [x] 7.1 更新 `lib/data/members.ts` `getMemberDetail`：查詢加入 `church { select: { name: true } }`、`churchType`、`churchOther`
- [x] 7.2 更新 `app/(user)/admin/members/[id]/page.tsx`：基本資料區塊補顯示「所屬教會/單位」（church.name / churchOther / 「—」）

## 8. 後台首頁

- [x] 8.1 更新 `app/(user)/admin/page.tsx`：功能卡片新增「教會管理」（`/admin/churches`，`IconChurch` 或 `IconBuilding` 圖示，所有 admin 可見）

## 9. 版本與文件

- [x] 9.1 `config/version.json` patch 版本號 +1
- [x] 9.2 依 `.ai-rules.md` 更新 `README-AI.md`
