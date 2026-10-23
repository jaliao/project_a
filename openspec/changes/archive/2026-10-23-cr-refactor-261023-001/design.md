## Context

目前「身分標籤」在五個地方各自實作，邏輯與樣式不一致：

| 位置 | 目前邏輯 | 是否含未註冊學員 | 樣式 |
|---|---|---|---|
| `/user/[spiritId]` 身分標籤區塊 | `getIdentityTags(roles, t)`（只處理 roles） | 外加 `UnregisteredStudentBadge`（獨立於迴圈外） | role 標籤 `secondary`；未註冊學員琥珀色 |
| `/admin/members` 列表「身分」欄 | `member.roles.map(ROLE_LABELS)` | 否（獨立顯示於姓名旁） | `secondary` |
| `/admin/members/[id]` 詳情頁「身分」欄位 | 同上 | 否（獨立顯示於姓名旁） | `secondary` |
| `duplicate-candidate-row.tsx` | 無角色顯示 | 是，獨立 Badge | 琥珀色 |
| `student-picker.tsx` | 無角色顯示 | 是，獨立 `span` | 琥珀色（pill） |

使用者要求收斂為單一商業邏輯 + 單一渲染元件，且取消「未註冊學員」的專屬警示色特別設計。

## Goals / Non-Goals

- **Goals**：
  - 身分標籤的計算（哪些文字該出現、順序）只有一份邏輯（`getIdentityTags()`）。
  - 身分標籤的渲染（Badge 樣式）只有一份元件（`IdentityTagBadges`）。
  - 「未註冊學員」不再有專屬顏色，與其他身分標籤視覺一致（`variant="secondary"`）。
  - 後台「身分」欄位／欄目同步納入未註冊學員狀態，不再與姓名旁獨立徽章分裂成兩份資訊。
- **Non-Goals**：
  - 不擴充 `duplicate-candidate-row.tsx`／`student-picker.tsx` 的資料查詢去抓 `roles`——這兩處原本就只關心「是否未註冊」這一個訊號，不在此次重構範圍內新增角色身分顯示（避免無謂的資訊量增加與查詢成本）。
  - 不變更「身分」篩選、搜尋、授權判定等既有業務邏輯，純顯示層重構。
  - 不處理 `admin-member-management` spec 中「代填學員邀請 Email 管理」需求（`isProxyMember` 相關的另一個獨立功能區塊，與本次身分標籤顯示無關，維持現狀）。

## Decisions

### 1. `getIdentityTags()` 新增 `isProxyMember` 參數與基準身分標籤

```ts
export function getIdentityTags(
  roles: Roles,
  isProxyMember: boolean,
  t?: RoleTranslator,
): string[] {
  const tags: string[] = []
  if (isProxyMember) tags.push(t ? t('unregisteredStudent') : '未註冊學員')
  if (canAccessAdmin(roles)) tags.push(t ? t('systemAdmin') : '系統管理員')
  for (const role of TEACHER_ROLES) {
    if (roles?.includes(role)) tags.push(t ? t(role) : ROLE_LABELS[role])
  }
  if (roles) tags.push(t ? t('user') : ROLE_LABELS.user) // 基準身分：只有在呼叫端確實提供 roles 資料時才附加
  return tags
}
```

**關鍵決定**：基準「一般會員」標籤**只有在 `roles` 參數確實被提供時才附加**（`roles` 為 `undefined`／`null` 時跳過，不當作「一般會員」顯示）。原因：

- `/user/[spiritId]`、`/admin/members` 列表、`/admin/members/[id]` 詳情頁三處都已查詢並持有完整 `roles`（`normalizeRoles` 保證恆含 `user` 基線），維持「身分」欄位現有資訊量（後台目前本來就會顯示「一般會員」Badge）。
- `duplicate-candidate-row.tsx`、`student-picker.tsx` 兩處目前查詢（`lib/data/duplicate-accounts.ts`、`lib/data/student-picker.ts`）**沒有** select `roles` 欄位，呼叫時傳 `undefined`；此時函式不猜測、不顯示「一般會員」，只在 `isProxyMember` 為真時顯示「未註冊學員」，與這兩處原本的資訊量一致，不擴大查詢範圍。

**連帶影響**：`/user/[spiritId]` 的「身分標籤」區塊因此恆非空（至少含「一般會員」），移除既有「—」佔位符分支與對應的 `identity-tags` spec 中「無任何標籤時顯示佔位符」需求（視為 REMOVED，改為「標籤陣列恆非空」的隱含保證）。

### 2. 單一渲染元件 `IdentityTagBadges`

```ts
// components/shared/identity-tag-badges.tsx
export function IdentityTagBadges({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
      ))}
    </div>
  )
}
```

取代 `unregistered-student-badge.tsx`（整份刪除）與五處各自的 Badge/span JSX。`/user/[spiritId]` 現有的 `w-20 shrink-0` label 排版與既有 `<Badge variant="secondary">`（未加 `text-xs`）視覺差異極小，統一採 `text-xs`（與後台現行一致）。

### 3. 各呼叫點調整

| 檔案 | 變更 |
|---|---|
| `app/[locale]/(user)/user/[spiritId]/page.tsx` | `getIdentityTags(user.roles, user.isProxyMember, tRole)` → `<IdentityTagBadges tags={identityTags} />`；移除「—」佔位符分支 |
| `app/[locale]/(admin)/admin/members/page.tsx` | 「身分」欄改為 `getIdentityTags(member.roles, member.isProxyMember)` → `<IdentityTagBadges />`；移除姓名旁獨立 Badge；移除此處直接 import `ROLE_LABELS` 渲染 roles 的舊邏輯（若無其他用途則移除該 import） |
| `app/[locale]/(admin)/admin/members/[id]/page.tsx` | 頁首移除姓名旁獨立 Badge；「身分」欄位改為 `getIdentityTags(member.roles, member.isProxyMember)` → `<IdentityTagBadges />` |
| `components/admin/duplicate-candidate-row.tsx` | `getIdentityTags(undefined, side.isProxyMember)` → `<IdentityTagBadges />`（僅會含「未註冊學員」或空陣列） |
| `components/shared/student-picker.tsx` | `getIdentityTags(undefined, item.isProxyMember)` → `<IdentityTagBadges />` |

後台三處（`/admin/members`、`/admin/members/[id]`、`duplicate-candidate-row.tsx`、`student-picker.tsx`）維持後台既有「不走 i18n、維持繁體」慣例，呼叫 `getIdentityTags()` 時不傳 `t`；僅 `/user/[spiritId]` 傳入 `tRole`（`role` namespace，key `unregisteredStudent` 已於前次變更加入 `messages/zh-TW.json`／`en.json`，`zh-CN.json` 由既有腳本重新產生，本次不需再新增 key）。

## Risks / Trade-offs

- **行為變化**：`/user/[spiritId]` 的身分標籤區塊，一般會員（無任何加掛身分、非未註冊）將從顯示「—」改為顯示「一般會員」。評估為資訊更一致、非劣化變更，但屬於本次重構附帶的可見行為調整，實作時需在 `tasks.md` 中明確標註供驗收確認。
- **`identity-tags` spec 既有 Scenario「無標籤使用者」**（WHEN 使用者 role 為 user 且無任何結業證書 → 顯示「—」）將被移除，改為「一般會員」標籤恆顯示。
- 無資料庫 schema 變更、無 migration、無 API 行為變更，風險侵限於前端顯示層。

## Migration Plan

無資料遷移。屬於單次前端重構，依 `tasks.md` 逐檔修改＋跑 `npm run lint`／`tsc --noEmit` 驗證即可；無需 feature flag 或分階段上線。
