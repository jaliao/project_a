## Context

`lib/data/certificate.ts` 目前的 `enrollments` 查詢僅選取 `invite: { select: { courseCatalogId: true, courseCatalog: { select: { label: true } } } }`，未包含 `invite.createdBy`（即該課程邀請的建立者／講師）。`CourseInvite.createdById` 為必填欄位（非 optional），故每筆已結業報名一定能推導出一位講師，不需處理「無老師」的空狀態。

`lib/data/course-order.ts` 已有相同情境的既有實作（`instructor: MemberTagInfo`），本次直接比照其 `createdBy` select 欄位與 `churchLabel` 組裝邏輯，維持專案一致慣例，不重新設計。

## Goals / Non-Goals

**Goals:**
- 證書卡片新增「老師」列（會員文字元件呈現），取代「顯示名稱」列。
- Data Layer 補齊 `teacher: MemberTagInfo` 資料。

**Non-Goals:**
- 不變更「學員」列或既有 `member: MemberTagInfo` 的資料來源與呈現方式。
- 不新增「無老師」的空狀態處理（`createdById` 為必填關聯，恆有值）。

## Decisions

### `enrollments` 查詢的 `invite.createdBy` select 比照 `course-order.ts`
```ts
invite: {
  select: {
    courseCatalogId: true,
    courseCatalog: { select: { label: true } },
    createdBy: {
      select: {
        id: true,
        spiritId: true,
        roles: true,
        realName: true,
        name: true,
        email: true,
        nickname: true,
        englishName: true,
        displayNameMode: true,
        avatarKey: true,
        image: true,
        gender: true,
        church: { select: { name: true } },
        churchOther: true,
      },
    },
  },
},
```

### `Eligible`／`CertificateListItem` 新增 `teacher: MemberTagInfo`
組裝邏輯與 `course-order.ts` 的 `instructor` 完全比照：
```ts
teacher: {
  id: e.invite.createdBy.id,
  spiritId: e.invite.createdBy.spiritId,
  roles: e.invite.createdBy.roles,
  displayName: getMemberDisplayName(e.invite.createdBy),
  realName: e.invite.createdBy.realName ?? null,
  gender: e.invite.createdBy.gender,
  churchLabel: e.invite.createdBy.church?.name ?? e.invite.createdBy.churchOther ?? null,
  avatarUrl: resolveAvatarUrl(e.invite.createdBy),
}
```
`teacher` 隨 `eligible` 的去重邏輯（依 `userId:courseCatalogId` 取最新結業日）一併帶入，不需額外查詢。

### UI：以「老師」列取代「顯示名稱」列
```tsx
<p>
  <span className="text-muted-foreground">學員：</span>
  <MemberTextTag {...it.member} />
</p>
<p>
  <span className="text-muted-foreground">老師：</span>
  <MemberTextTag {...it.teacher} />
</p>
<p className="break-words">
  <span className="text-muted-foreground">單位：</span>
  {it.churchLabel ?? '—'}
</p>
```
`CertificateListItem.displayName` 型別欄位保留（人名搜尋 `r.displayName.includes(q)` 仍依賴），僅移除卡片中獨立顯示該欄位的那一行 `<p>`。

## Risks / Trade-offs

- [風險] `teacher` 為新增必填欄位，若遺漏組裝會造成 TypeScript 編譯錯誤 → Mitigation：編譯期可完全捕捉。
- [風險] 同一講師的多筆課程邀請可能顯示不同教會/顯示名稱快照差異極小，此為既有 `instructor` 邏輯已接受的行為，非本次新增風險。
