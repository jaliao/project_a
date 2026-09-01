## 1. 資料層：`lib/data/friendship.ts`

- [x] 1.1 `import type { Gender, UserRole } from '@prisma/client'`（沿用專案 tsconfig paths 別名）
- [x] 1.2 `FriendListItem` 新增三欄：`gender: Gender`、`unitLabel: string | null`、`roles: UserRole[]`（放在 `avatarUrl` 之後、`addedAt` 之前）
- [x] 1.3 `getMyFriends` 的 `select.friend` 增加：`gender: true`、`roles: true`、`churchType: true`、`churchOther: true`、`church: { select: { name: true } }`
- [x] 1.4 `.map` 補：
  - `gender: r.friend.gender`
  - `unitLabel: r.friend.churchType === 'church' ? (r.friend.church?.name ?? null) : r.friend.churchType === 'other' ? (r.friend.churchOther ?? null) : null`
  - `roles: r.friend.roles`
- [x] 1.5 排序（`orderBy createdAt desc`）、`isFriend`、既有欄位皆不動

## 2. 元件：`components/community/friends-list.tsx` 改卡片格狀

- [x] 2.1 檔首註解補一行：`cr-spec-260901-005：清單列 → 響應式卡片格狀（顯示名稱（性別）／單位／身分別 ＋ 傳訊息／刪除按鈕）`
- [x] 2.2 import 調整：加 `Badge`（`@/components/ui/badge`）、`IconMessage`／`IconTrash`（`@tabler/icons-react`，移除不再用的 `IconDotsVertical`）；加 `const tRole = useTranslations('role')`
- [x] 2.3 空狀態區塊（`friendsEmpty`）維持不變
- [x] 2.4 容器：`<div className="divide-y rounded-lg border">` → `<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">`
- [x] 2.5 每張卡：`<div key={f.userId} className="flex flex-col gap-3 rounded-lg border p-4">`
  - 頂部 `flex items-start gap-3`：`<UserAvatar avatarUrl={f.avatarUrl} displayName={f.displayName} />` ＋ `<div className="min-w-0">`：
    - `<p className="truncate text-sm font-medium">{nameWithGender}</p>`，`nameWithGender` = `f.gender === 'male' ? \`\${f.displayName}（\${t('genderMale')}）\` : f.gender === 'female' ? \`\${f.displayName}（\${t('genderFemale')}）\` : f.displayName`
    - `{f.spiritId && <p className="truncate font-mono text-xs text-muted-foreground">{f.spiritId}</p>}`
  - 單位：`<p className="text-sm text-muted-foreground">{f.unitLabel ?? '—'}</p>`
  - 身分別：`<div className="flex flex-wrap gap-1">{f.roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{tRole(r)}</Badge>)}</div>`
  - 功能列：`<div className="mt-auto flex gap-2">`
    - 傳訊息：`<Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenConversation(f.userId)}><IconMessage className="mr-1 h-4 w-4" />{t('cardMessage')}</Button>`
    - 刪除：既有 `AlertDialog`，trigger 改 `<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" aria-label={tc('delete')}><IconTrash className="mr-1 h-4 w-4" />{tc('delete')}</Button>`；`AlertDialogContent` 標題 `t('removeConfirm')`、Cancel `tc('cancel')`、Action（`disabled={removingId === f.userId}`、`onClick={() => handleRemove(f.userId)}`）保留 `IconTrash` ＋ `t('removeFriend')`
- [x] 2.6 移除舊的「整列 `<button onClick={onOpenConversation}>`」與 `IconDotsVertical` trigger；`handleRemove` / `removingId` 狀態與 `removeFriend` action 匯入不動
- [x] 2.7 props（`friends` / `onOpenConversation` / `onRemoved`）簽章不變

## 3. i18n

- [x] 3.1 `messages/zh-TW.json` `community` 新增：`genderMale`「男」、`genderFemale`「女」、`cardMessage`「傳訊息」
- [x] 3.2 `messages/en.json` `community` 補：`genderMale`「Male」、`genderFemale`「Female」、`cardMessage`「Message」
- [x] 3.3 「刪除」用既有 `common.delete`（`tc('delete')`），不新增 key；`role` 命名空間沿用不動
- [x] 3.4 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`（確認 `community.genderMale/genderFemale/cardMessage` 有簡體）

## 4. 驗證

- [x] 4.1 `npx eslint lib/data/friendship.ts components/community/friends-list.tsx`：0 error
- [x] 4.2 `npx tsc --noEmit`：0 error（`FriendListItem` 擴充後 `messages-page.tsx` / `page.tsx` 仍編譯通過）
- [x] 4.3 `npm run build`：`✓ Compiled successfully`
- [ ] 4.4 **（人工實測）** 「好友」頁籤：卡片格狀，手機 1 欄／`sm` 2 欄／`lg` 3 欄；每張卡顯示頭像、顯示名稱（性別）、單位（無值「—」）、身分別（`roles` 逐一標籤，含「一般會員」）
- [ ] 4.5 **（人工實測）** 卡片「傳訊息」→ 切到「訊息」頁籤並開啟與該好友的對話（有既有對話顯示選擇畫面、否則新對話）
- [ ] 4.6 **（人工實測）** 卡片「刪除」→ 確認框 → 清單移除、既有對話保留；`?tab=` / `?with=` 與加好友 Drawer 不受影響
- [ ] 4.7 **（人工實測）** 性別 `unspecified` 的好友卡片只顯示名稱、無括號；`en` 語系卡片文案為英文

## 5. 文件與版本號

- [x] 5.1 `doc/學員手冊.md`〈十五、社群〉「好友頁籤」段改寫為卡片描述（顯示名稱（性別）／單位／身分別 ＋「傳訊息」「刪除」兩按鈕）；檔首版本＋日期改當日
- [x] 5.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：無好友頁籤操作章節，內容不動；檔首版本＋日期同步（比照 rule 9）
- [x] 5.3 `config/version.json`：patch +1、`updatedAt` = 當日
- [x] 5.4 `ai-context/03-architecture.md`：`lib/data/friendship.ts` 條目補 `getMyFriends` 新欄位（`gender`／`unitLabel`／`roles`）、社群「好友」頁籤改「卡片格狀」
- [x] 5.5 `ai-context/07-current-tasks.md`「已完成」最前面追加 `cr-spec-260901-005 社群好友清單（卡片化）`
- [x] 5.6 `README-AI.md`：版本行更新
