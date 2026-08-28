# 設計說明

小型 UI 變更：在後台既有操作區加一顆連往前台會員首頁的按鈕。以下記錄幾個實作決策。

## 決策 1：抽共用元件 `MemberHomeLink`，三處共用

三個使用點（`/admin/members` 清單、`/admin/members/inactive` 清單、`/admin/members/[id]` 詳情頁首）行為完全相同，抽 `components/admin/member-home-link.tsx` 避免重複與日後不一致。

```tsx
/*
 * ----------------------------------------------
 * 後台「會員首頁」快捷按鈕
 * 2026-08-28
 * components/admin/member-home-link.tsx
 * ----------------------------------------------
 */
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  spiritId: string | null
  size?: 'sm' | 'default'
  variant?: 'ghost' | 'outline'
}

export function MemberHomeLink({ spiritId, size = 'sm', variant = 'ghost' }: Props) {
  if (!spiritId) {
    return (
      <Button variant={variant} size={size} disabled title="此會員尚無啟動編號">
        會員首頁
      </Button>
    )
  }
  return (
    <Button variant={variant} size={size} asChild>
      <Link
        href={`/user/${spiritId.toLowerCase()}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        會員首頁
      </Link>
    </Button>
  )
}
```

- 純連結、無互動狀態 → 不需 `"use client"`。
- 用 `next/link`（非 `@/i18n/navigation`）：比對同檔既有「查看詳情」`<Link href={`/admin/members/${id}`}>` 與 `components/layout/topbar.tsx` 的 `homeUrl = `/user/${spiritId.toLowerCase()}``，middleware 會處理 locale 前綴。

## 決策 2：新分頁開啟

管理者常在 `/admin/members` 反覆搜尋、逐一檢視。若同分頁導航到 `(user)` group 會失去搜尋字串與捲動位置，返回還要重新查。故 `target="_blank"` + `rel="noopener noreferrer"`。詳情頁首同理（保留分頁狀態）。

## 決策 3：`spiritId` 來源，不動資料層

- `/admin/members`：`searchMembers()` 回傳項目已含 `spiritId`（`lib/data/members.ts` select）。
- `/admin/members/[id]`：`getMemberDetail()` 已 select `spiritId`。
- `/admin/members/inactive`：`listInactiveMembers()`（`lib/data/account-recovery.ts`）已回傳 `spiritId`。

三處皆可能為 `null`（未啟用會員尤甚）→ 元件內建 disabled 分支處理，呼叫端直接 `spiritId={x.spiritId}` 傳入即可。

## 決策 4：插入位置

- 兩個清單：「操作」欄的 `flex items-center justify-end gap-2` 容器內，放在「查看詳情」之後、其他按鈕（`MemberResetButton` 等）之前，符合需求「查看詳情旁邊」。
- 詳情頁：頁首 `flex items-center gap-4` 容器尾端（「傳訊息」之後）。

## 決策 5：權限

`/user/[spiritId]` 在 `(user)` group，`(user)/layout.tsx` 僅要求「已登入 + 非暫停 + 非臨時密碼 + profile 完整」，不限制只能看自己。管理者本就通過這些守衛，頁面本身也已針對「非本人」隱藏本人專屬區塊。故不需任何權限調整，也不需在 `route-access.ts` 新增條目。

## 非目標

- 不做「以該會員身分登入／impersonate」。
- 不改 `/user/[spiritId]` 頁面內容或版面。
- 不 i18n key 化按鈕文字（後台字串本階段維持繁體，CLAUDE.md #12）。
