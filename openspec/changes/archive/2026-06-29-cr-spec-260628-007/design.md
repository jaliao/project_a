## Context

課程詳情頁（`app/(user)/course/[id]/page.tsx`）的「結業資訊」區塊（約 174–243 行）目前僅以 `isCompleted && courseSession.completedAt` 作為顯示條件，對所有登入會員可見。其內容包含已／未結業學員清單與未結業原因，屬課程管理層級資訊，不應對一般學員開放。系統已有現成身分判定工具 `canTeachAny(roles)`（`lib/auth-roles.ts`），頁面亦已透過 `auth()` 取得 `userSession.user.roles`。

## Goals / Non-Goals

**Goals:**
- 結業資訊區塊僅在「課程已結業」且「使用者為管理者或講師」時顯示。
- 沿用既有 `canTeachAny(roles)`，不新增權限 API、不新增資料查詢。

**Non-Goals:**
- 不變更「講師資格回饋」入口的既有規則（仍僅課程建立者可見）。
- 不變更結業流程、結業判定或資料模型。
- 不限縮為「僅課程本身建立者可見」——任一講師身分或管理者皆可查閱。

## Decisions

- **以 `canTeachAny(userSession.user.roles)` 作為可見性閘門**，與顯示條件 `isCompleted && courseSession.completedAt` 以 `&&` 串接。
  - 理由：`canTeachAny` 已定義「管理者或任一書籍講師」語意，與需求「管理者和講師」完全對應，避免重複實作角色字串比對。
  - 替代方案：(a) 僅課程建立者 `isInstructor` 可見——過窄，排除其他講師與管理者，與需求不符；(b) 自行 inline 比對 `roles.includes(...)`——重複邏輯、易漏 superadmin。
- **純前端（伺服器元件）渲染條件調整**：區塊本就由伺服器元件條件渲染，加入身分判定即可；非授權使用者根本不會收到該區塊 HTML，無需額外 API 層防護。

## Risks / Trade-offs

- [一般學員仍可能想查看自己是否結業] → 本變更僅隱藏「課程管理層級的全員結業清單」，學員個人結業狀態另由學習紀錄／結業證書相關功能呈現，不受影響。
- [roles 未即時同步] → `lib/auth.ts` 已於每次請求自 DB 同步 `roles`，身分變更即時生效，風險低。

## Migration Plan

- 單檔前端條件調整，無資料庫遷移、無 API 變更。部署即生效；如需回退，還原該顯示條件即可。

## Open Questions

- 無。
