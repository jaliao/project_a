## Context

`getCertificateProductionList`（`lib/data/certificate.ts`）已經查詢 `InviteEnrollment.invite`（取 `courseCatalogId`／`courseCatalog.label`），教師資訊只需在同一個 `invite` select 裡加上 `createdBy`，不需要新增查詢或 join。

`MemberTagInfo` 型別目前定義在 `lib/data/course-order.ts`——這是 `cr-spec-260804-001` 當時的暫定放置位置（tasks.md 2.2 當時就註記「放在 course-order.ts 或 member-tag.tsx 皆可」）。現在第二個資料層也需要同一型別，繼續放在 `course-order.ts` 會變成語意上不相關的資料層互相 import，不合理；元件本身（`member-tag.tsx`）才是這個型別契約的實際擁有者。

## Goals / Non-Goals

**Goals:**
- 證書卡片新增教師資訊，以 `MemberTag` 呈現，管理者可直接檢視/聯繫教師。
- `MemberTagInfo` 型別歸屬合理化，供多個資料層重用不產生跨資料層依賴。

**Non-Goals:**
- 不重新設計證書卡片既有版面配置以外的部分。
- 不處理 `MemberTag` 在其他頁面的進一步套用（範圍僅此頁）。

## Decisions

### 教師來源：`InviteEnrollment.invite.createdBy`，且必為單一結果（不去重）
`InviteEnrollment.inviteId`／`CourseInvite.createdById` 皆為必填（non-nullable）關聯，資料庫層級保證每筆結業紀錄都能追溯到唯一一位教師。清單既有邏輯已經是「同人同階層取最新結業日的那一筆 `InviteEnrollment`」，教師資訊直接取自那一筆的 `invite.createdBy`，不需要額外的去重或多值處理——每張證書卡片恰好對應一位教師。

### `MemberTagInfo` 型別遷移至 `components/admin/member-tag.tsx`
```ts
// components/admin/member-tag.tsx
export type MemberTagInfo = { id: string; spiritId: string | null; roles: string[]; displayName: string; avatarUrl: string | null }
```
`lib/data/course-order.ts` 改為 `import type { MemberTagInfo } from '@/components/admin/member-tag'`。純搬移＋改 import 路徑，型別內容、`getAllCourseOrdersWithInvite` 的行為皆不變。

### `teacher` 欄位不可為 `null`（與教材申請的 `instructor` 不同）
教材申請的 `CourseOrderWithInvite.instructor` 可為 `null`，因為訂單本身可能是「獨立訂單」（`courseInviteId` 為 `null`，訂單與課程無關聯）。證書清單的每一筆都源自 `InviteEnrollment`，而 `InviteEnrollment.invite` 是必填關聯，不存在「無課程可歸屬」的情況，因此 `CertificateListItem.teacher: MemberTagInfo`（非 `| null`），呼叫端與 UI 不需要處理空值分支，比教材申請的用法更單純。

## Risks / Trade-offs

- [風險] 型別搬移涉及跨兩個檔案（`course-order.ts`／`member-tag.tsx`）的 import 調整，若遺漏會直接造成 TypeScript 編譯錯誤 → Mitigation：搬移後立即跑 `tsc --noEmit` 驗證，且此為編譯期可完全捕捉的錯誤類型，無執行期風險。
