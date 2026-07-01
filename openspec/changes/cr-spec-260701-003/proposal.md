## Why

學員申購教材目前只選版本（繁/簡），沒有記錄「書本上要印/對應的名字」；老師統一申請與寄送時只有繁/簡「數量」，看不到是哪位學員、要送到哪個地址，多地址寄送難以正確分書。需讓學員申購時填「書本名字」，並讓老師/管理者以「逐本（學員名＋版本）」方式，用「先建地址、再指派書本」的流程分配到各寄送地址。

## What Changes

- **學員申購書本名字**：學員申購教材（選版本）時，同時填「書本名字」，**預設帶入 中文名→英文名→匿名**，可自行編輯。存於 `InviteEnrollment.materialBookName`。
- **逐本項目**：每位已核准且選了版本的學員 → 一個書本項目 `{ 書本名字, 版本(繁/簡) }`（自動由報名產生）。
- **地址優先指派（老師教材訂購 / 管理者後台共用）**：
  - **先新增寄送地址**（收件人＋超商門市/宅配地址，只需填一次）。
  - 再將**書本項目勾選指派到該地址**（避免逐本重複填地址/選門市）。
  - 每個地址顯示其分到的「學員名＋版本」清單；繁/簡本數由項目數推導（相容既有列印/顯示）。
- **管理者後台**：教材申請詳情顯示各地址的「學員名＋版本」與書本名字。

## Capabilities

### New Capabilities

- `material-book-items`: 教材以「逐本項目（學員書本名字＋版本）」表示，並支援「地址優先」指派書本項目至各寄送地址。

### Modified Capabilities

- `enrollment-application`: 學員申購時新增「書本名字」（預設中文→英文→匿名，可編輯）。
- `material-multi-address-shipping`: 多地址寄送由「數量拆分」改為「逐本項目指派」，採先建地址再指派書本的流程。
- `admin-material-management`: 教材申請詳情呈現各地址的學員名＋版本與書本名字。

## Impact

- `prisma/schema/course-invite.prisma`：`InviteEnrollment` 新增 `materialBookName String?`
- `prisma/schema/course-order.prisma`：新增「書本項目 ↔ 寄送地址」關聯（逐本指派）；與既有 `MaterialShipment.traditionalQty/simplifiedQty` 相容（數量由項目推導）→ migration
- 學員申購：`components/course-session/enrollment-application-dialog.tsx`、`app/actions/course-invite.ts`（`applyToCourse` 接收 bookName、預設帶入）
- 老師教材訂購：`components/course-order/course-order-form.tsx`（多地址改地址優先＋書本指派）、`app/actions/course-order.ts`、`lib/data/course-order.ts`、`lib/data/course-sessions.ts`（提供書本項目清單）
- 管理者後台：`components/admin/material-order-table.tsx`（各地址顯示學員名＋版本）、列印頁
- `doc/` 三份手冊（學員/老師/管理者）、`config/version.json`、README-AI
- 資料模型細節（項目↔地址關聯、與 qty 相容、單一地址情境）於 design 拍板；純既有網域擴充，繁體/沿用 i18n key
