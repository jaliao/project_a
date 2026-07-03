# 後台機敏資料遮蔽（cr-spec-260701-008）

## Why

後台學員頁面目前將 Email（清單、詳情）以明文直接呈現，管理者在公開場合操作或螢幕分享時容易外洩會員個資。機敏欄位（電話、電子郵件）應預設遮蔽、需要時再主動點擊檢視，降低旁窺（shoulder surfing）風險。

## What Changes

- 新增通用「機敏資料遮蔽」顯示元件：預設以 `***` 遮蔽呈現，點一下切換為明文檢視、再點一下（或依設計）恢復遮蔽；空值維持顯示 `—`。
- `/admin/members` 會員清單：Email 欄改為遮蔽顯示、可逐筆點擊檢視。
- `/admin/members/[id]` 會員詳情「基本資料」：Email 改為遮蔽顯示；並新增「電話」欄位（同樣預設遮蔽、點擊檢視）。
- `/admin/members/inactive` 未登入會員清單：Email 欄改為遮蔽顯示、可逐筆點擊檢視。
- 搜尋行為不變：清單搜尋仍可用 Email 比對（遮蔽僅為顯示層行為）。

## Capabilities

### New Capabilities
- `admin-sensitive-masking`: 後台機敏欄位遮蔽顯示的通用行為——預設 `***`、點擊切換檢視、空值處理，適用電話與電子郵件欄位。

### Modified Capabilities
- `admin-member-management`: 會員清單 Email 欄與詳情頁 Email 改為遮蔽顯示；詳情頁基本資料新增「電話」欄位（遮蔽顯示）。
- `admin-inactive-members`: 清單 email 欄改為遮蔽顯示。

## Impact

- **UI 元件**：新增 client 元件（如 `components/admin/masked-value.tsx`），供各學員頁面共用。
- **頁面**：`app/[locale]/(admin)/admin/members/page.tsx`、`app/[locale]/(admin)/admin/members/[id]/page.tsx`、`app/[locale]/(admin)/admin/members/inactive/page.tsx`。
- **資料層**：詳情頁需 select `phone`（`lib/data/members.ts` 既有查詢確認欄位涵蓋）。
- **範圍外**：教材訂單表（`components/admin/material-order-table.tsx`）之收件人電話/Email 本次不處理，可於後續變更擴充。
- **手冊**：`doc/管理者操作手冊.md` 會員管理章節需補充遮蔽/點擊檢視說明；`config/version.json` patch +1（依 CLAUDE.md 第 7、9 點，於 apply 階段執行）。
