## Context

Dashboard 首頁（`app/(user)/dashboard/page.tsx`）已於 cr-spec-260324-005 重組為三個功能單元：學習、授課、管理者。目前「學習」單元對所有已登入使用者均可見，但管理者角色不需要「加入學習」或查看「學習紀錄」，其主要任務是開課管理，顯示學習單元反而造成介面雜訊。

session.user.role 已透過 JWT 傳入，Server Component 可直接讀取。

## Goals / Non-Goals

**Goals:**
- 學習單元僅對 `user` 角色顯示；`admin` / `superadmin` 不顯示
- 維持授課單元與管理者單元的現有邏輯不變
- 純 UI 條件渲染，不需新增 API 或 DB 查詢

**Non-Goals:**
- 不新增管理者專屬的開課介面（授課單元已涵蓋）
- 不改變學習頁面（`/learning`）本身的存取權限
- 不建立角色專屬 layout

## Decisions

### 1. 條件渲染在 Server Component

角色判斷與管理者單元的做法一致：直接在 `page.tsx` 以 `session?.user?.role` 條件渲染學習單元，無需 Client Component 或額外 fetch。

### 2. 負向條件（排除 admin/superadmin）

使用 `role !== 'admin' && role !== 'superadmin'` 包覆學習單元，而非列舉 `role === 'user'`，以便未來若新增角色時預設仍可見學習單元，需明確設定才隱藏。

## Risks / Trade-offs

- **未來新增角色時預設顯示學習單元**：負向條件策略讓新角色預設看到學習單元，管理員需手動評估是否需要隱藏 — 此行為符合「最小驚奇原則」（新角色預設與一般使用者相同體驗）
