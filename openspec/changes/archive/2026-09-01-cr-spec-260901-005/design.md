## Context

現況（cr-spec-260901-003 已封存並上線）：

- **`lib/data/friendship.ts`**：
  ```ts
  export type FriendListItem = {
    userId: string; spiritId: string | null; displayName: string
    avatarUrl: string | null; addedAt: Date
  }
  export async function getMyFriends(userId): Promise<FriendListItem[]>  // where ownerId, orderBy createdAt desc
  ```
  `select.friend` 目前只取 `id / spiritId / avatarKey / image / realName / englishName / nickname / displayNameMode`。`.map` 用 `getMemberDisplayName` 與 `resolveAvatarUrl`。
- **`components/community/friends-list.tsx`**（client）：props `{ friends, onOpenConversation, onRemoved }`。容器 `divide-y rounded-lg border`；每列 `flex items-center gap-3 px-3 py-2`——左側整塊 `<button onClick={onOpenConversation(f.userId)}>`（頭像＋顯示名＋`spiritId`），右側 `AlertDialog`（trigger `IconDotsVertical`；內容標題 `t('removeConfirm')`、Cancel `tc('cancel')`、Action `removeFriend` → `handleRemove`）。`useTranslations('community')` ＋ `useTranslations('common')`。空清單 → `rounded-lg border p-10 text-center` `t('friendsEmpty')`。
- **`components/conversation/messages-page.tsx`**：`<TabsContent value="friends"><FriendsList friends={friends} onOpenConversation={(uid) => { changeTab('messages'); openWithUser(uid) }} onRemoved={reloadFriends} /></TabsContent>`。
- **`app/[locale]/(user)/messages/page.tsx`**（server）：`Promise.all([getMyConversations, getMyFriends])` → `initialFriends`。
- **`app/actions/friendship.ts`**：`fetchMyFriends()` = `getMyFriends(currentUserId)`（client tab 重整）；`removeFriend(friendUserId)`；`addFriendBySpiritId`。

參考既有慣例：

- **性別文字**：`lib/data/support-inquiry.ts` `genderLabel(gender)` = `male→'男' / female→'女' / else '未設定'`（非 React／資料層用）。前台 React 依 rule 12 走 i18n；`onboarding` 命名空間有 `male`/`female`（無 `unspecified`）。
- **單位文字**：`lib/data/support-inquiry.ts` `churchLabel({ churchType, church, churchOther })` = `church→church.name / other→churchOther / else '—'`（比照 `admin/members/[id]`）。
- **身分（後台會員管理）**：`app/[locale]/(admin)/admin/members/page.tsx` 的「身分」欄＝`(member.roles as UserRole[]).map(r => <Badge variant="secondary">{ROLE_LABELS[r] ?? r}</Badge>)`。`ROLE_LABELS`（`lib/auth-roles.ts`）：`user`→「一般會員」、`teacher_1/2/3`→「啟動靈人／豐盛／得勝講師」、`admin`→「管理者」、`superadmin`→「超級管理者」。**含基線 `user`**。
- **i18n `role` 命名空間**（`messages/zh-TW.json`）已存在且值與 `ROLE_LABELS` 一致：`user / teacher_1 / teacher_2 / teacher_3 / admin / superadmin`。

## Goals / Non-Goals

**Goals：**
- 「好友」頁籤由清單列改為**資訊卡片**，響應式格狀（手機 1 欄、`sm` 2 欄、`lg` 3 欄）。
- 每張卡：頭像、**顯示名稱（性別）**、**單位**、**身分別**（比照後台會員管理：`roles` 逐一標籤，含 `user`）。
- 卡面兩顆按鈕：**傳訊息**（＝既有開對話流程）、**刪除**（＝既有 `AlertDialog` 確認移除）。
- 資料層 `getMyFriends` 補 `gender` / `unitLabel` / `roles`。

**Non-Goals：**
- 不改單向好友模型、加好友流程、通知、傳訊息授權、`?with=` 深連結、`messages-page.tsx` / `page.tsx` / `app/actions/friendship.ts`。
- 不改「訊息」頁籤。
- 不動 `prisma/schema/*`（所有欄位皆既有）。
- 不把後台 `ROLE_LABELS` 改成 i18n（後台維持繁體）；本 CR 只在前台卡片用 `role` 命名空間。
- 不新增 `identity-tags` 或「學員／講師」二分邏輯。

## Decisions

### D1：`FriendListItem` 擴充三欄

```ts
import type { Gender, UserRole } from '@prisma/client'

export type FriendListItem = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  gender: Gender                 // 新增
  unitLabel: string | null       // 新增：church.name / churchOther / null
  roles: UserRole[]              // 新增：原樣帶出
  addedAt: Date
}
```

`getMyFriends` 的 `select.friend` 增加：`gender: true`、`roles: true`、`churchType: true`、`churchOther: true`、`church: { select: { name: true } }`。

`.map`：
```ts
gender: r.friend.gender,
unitLabel:
  r.friend.churchType === 'church' ? (r.friend.church?.name ?? null)
  : r.friend.churchType === 'other' ? (r.friend.churchOther ?? null)
  : null,
roles: r.friend.roles,
```

`unitLabel` 回 `null`（非 `'—'`），placeholder 交給前台 i18n／`'—'` 呈現決定，與資料層不綁死顯示字串。

### D2：卡片版面

`friends-list.tsx` 容器：
```
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
```
（手機隱含 1 欄）。空狀態區塊不變。

每張卡：
```
<div className="flex flex-col gap-3 rounded-lg border p-4">
  <div className="flex items-start gap-3">
    <UserAvatar avatarUrl={f.avatarUrl} displayName={f.displayName} />
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{nameWithGender}</p>
      {f.spiritId && <p className="truncate font-mono text-xs text-muted-foreground">{f.spiritId}</p>}
    </div>
  </div>

  <p className="text-sm text-muted-foreground">{f.unitLabel ?? '—'}</p>

  <div className="flex flex-wrap gap-1">
    {f.roles.map((r) => (
      <Badge key={r} variant="secondary" className="text-xs">{tRole(r)}</Badge>
    ))}
  </div>

  <div className="mt-auto flex gap-2">
    <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenConversation(f.userId)}>
      <IconMessage className="mr-1 h-4 w-4" />{t('cardMessage')}
    </Button>
    <AlertDialog> …（trigger：<Button variant="ghost" size="sm">，IconTrash ＋ tc('delete')）… </AlertDialog>
  </div>
</div>
```

- `nameWithGender` = `f.gender === 'male' ? \`\${f.displayName}（\${t('genderMale')}）\` : f.gender === 'female' ? \`\${f.displayName}（\${t('genderFemale')}）\` : f.displayName`。
- `tRole = useTranslations('role')`。
- 刪除鈕沿用現有 `AlertDialog` 結構與 `handleRemove` / `removingId` 狀態，只是 trigger 從 `IconDotsVertical` 換成 `IconTrash` ＋ 文字、樣式 destructive 語氣（`text-destructive` 或維持 ghost）。
- `mt-auto` 讓不同卡片內容高度不一時，按鈕列對齊卡片底緣。

### D3：i18n

`community` 命名空間新增（`zh-TW` ＋ `en`）：
| key | zh-TW | en |
| --- | --- | --- |
| `genderMale` | 男 | Male |
| `genderFemale` | 女 | Female |
| `cardMessage` | 傳訊息 | Message |

「刪除」用既有 `common.delete`（`tc('delete')`），不新增 `cardDelete`。`role` 命名空間沿用。改 `zh-TW` 後 `npm run gen:zh-cn` 重產簡體（`prebuild` 也會跑）。

### D4：互動語意變更

- 舊：整列可點 → 開對話；「⋮」→ 展開才看到移除。
- 新：卡片本身不可點；「傳訊息」按鈕 → `onOpenConversation`（行為完全同舊的列點擊：`changeTab('messages')` ＋ `openWithUser`）；「刪除」按鈕直接在卡面，點擊即跳 `AlertDialog` 確認。
- `onOpenConversation` / `onRemoved` 的 prop 契約與 `messages-page.tsx` 呼叫端不變。

## Risks / Trade-offs

- **`roles` 可能只有 `[user]`**：卡片會顯示單一「一般會員」標籤——與後台會員管理列表一致（後台也顯示 `user`），符合使用者「比照後台」的指定。
- **性別 `unspecified`**：省略括號（不顯示「（未設定）」），避免卡片視覺雜訊；CR 只要求「顯示名稱（性別）」，未指定未填時的樣式。
- **單位缺值**：顯示 `'—'`，與 `churchLabel` 既有慣例一致。
- **格狀在極窄視窗**：`grid` 無 `grid-cols-1` 明寫，靠預設單欄；卡內 `min-w-0` ＋ `truncate` 防溢出。
- **i18n 缺 key 回退**：`en.json` 缺 key 會回退繁體（`i18n/request.ts` deepMerge），不影響功能。

## Migration Plan

無資料庫 / 無資料遷移。純前端＋資料層 select 擴充，部署即生效。回滾＝還原 `friendship.ts` 與 `friends-list.tsx`，移除新增的 i18n key，`config/version.json` 回退。

## Open Questions

無。
