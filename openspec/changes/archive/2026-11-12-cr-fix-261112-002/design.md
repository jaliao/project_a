## Context

列表頁 `app/[locale]/(admin)/admin/members/page.tsx` 的搜尋/篩選狀態（`q`、`gender`、`role`、`church`）與分頁（`page`）已經是 URL query 驅動（server component 讀 `searchParams`），本身具備「可分享網址」的特性。目前唯一缺口是：列表 → 詳情頁的「查看詳情」連結（`page.tsx:135`）沒有把這些參數帶過去，詳情頁的返回連結因此也沒有上下文可還原。

詳情頁 `app/[locale]/(admin)/admin/members/[id]/page.tsx` 目前 `searchParams` 型別僅為 `{ locale: string }`（由 Next.js route 參數提供，見檔案開頭 `params` 解構），尚未讀取 query string。

## Goals / Non-Goals

**Goals:**
- 「查看詳情」連結帶出列表頁目前的篩選/搜尋/分頁參數。
- 詳情頁「返回會員管理」連結以這些參數組回原本的列表網址。
- 無參數時（直接開啟詳情頁網址、或由其他未帶參數的入口進入）行為與現況一致。

**Non-Goals:**
- 不改動列表頁篩選/搜尋/分頁本身的查詢邏輯（`searchMembers`、`hasAnyMemberFilter`）。
- 不處理其他導向 `/admin/members/[id]` 但不具列表篩選上下文的入口（`duplicate-candidate-row.tsx`、`member-tag.tsx`、`member-hierarchy-tree.tsx`、`support-inquiry-card.tsx`）——這些入口本身就不是「從篩選後的列表點進來」，維持現狀導回無參數列表頁即為正確行為，不屬本次範圍。
- 不引入 client-side 狀態管理（如 sessionStorage）保存篩選狀態；沿用專案既有「URL 即狀態」慣例，與列表頁本身的設計一致。

## Decisions

### 1. 直接複用同名查詢參數，列表頁→詳情頁→返回連結三段皆用 `q`／`gender`／`role`／`church`／`page`

不额外設計一個合併編碼的參數（如 `?returnQs=`），直接用與列表頁相同的參數名稱透傳，三處程式碼心智模型一致、不需額外編解碼：

```tsx
// page.tsx（列表頁）：比照既有 exportParams 的寫法，另組一份給「查看詳情」連結用
const detailQs = new URLSearchParams()
if (filters.q) detailQs.set('q', filters.q)
if (filters.gender) detailQs.set('gender', filters.gender)
if (filters.role) detailQs.set('role', filters.role)
if (filters.church) detailQs.set('church', filters.church)
if (page > 1) detailQs.set('page', String(page))
const detailQsStr = detailQs.size ? `?${detailQs.toString()}` : ''
// ...
<Link href={`/admin/members/${member.id}${detailQsStr}`}>查看詳情</Link>
```

```tsx
// [id]/page.tsx（詳情頁）：searchParams 型別新增同一組可選欄位
export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<{ q?: string; gender?: string; role?: string; church?: string; page?: string }>
}) {
  const sp = await searchParams
  const backQs = new URLSearchParams()
  if (sp.q) backQs.set('q', sp.q)
  if (sp.gender) backQs.set('gender', sp.gender)
  if (sp.role) backQs.set('role', sp.role)
  if (sp.church) backQs.set('church', sp.church)
  if (sp.page) backQs.set('page', sp.page)
  const backHref = backQs.size ? `/admin/members?${backQs.toString()}` : '/admin/members'
  // ...
  <Link href={backHref}>← 返回會員管理</Link>
```

- `page` 僅 `> 1` 時才寫入（與列表頁 `exportParams` 慣例一致，第 1 頁不需要出現在網址上）。
- 詳情頁對收到的參數**不做二次驗證**（例如 `gender`/`role` 是否為合法 enum 值）——這組參數只會被原樣透傳回 `/admin/members`，由列表頁既有邏輯（`MemberFilters` 轉型與 `searchMembers`）負責驗證與容錯，詳情頁不需重複一份驗證邏輯。
- 無任何參數時 `backQs.size === 0`，回退為現況的 `/admin/members`（不帶 `?`）。

### 2. 其他未帶篩選上下文的入口維持現狀，不強制補齊參數

`duplicate-candidate-row.tsx`、`member-tag.tsx`、`member-hierarchy-tree.tsx`、`support-inquiry-card.tsx` 等連到 `/admin/members/[id]` 的入口，其所在頁面本身不是「篩選後的會員列表」，沒有 `q`/`gender`/`role`/`church`/`page` 可帶。這些入口維持現狀（不帶參數），詳情頁收到的 `searchParams` 自然為空，返回連結照 Decision 1 的 fallback 行為導回無參數列表頁——與目前行為一致，不是新的退化。

## Risks / Trade-offs

- 查詢參數會出現在詳情頁網址上（例如 `/admin/members/xxx?q=王小明&page=2`），屬可預期的小副作用，與列表頁本身「URL 即狀態」的既有設計一致，不視為風險。
- 若未來「查看詳情」連結改為 client-side 跳轉（目前仍是純 `<Link>` server component），需確認 query string 透傳邏輯一併搬移；本次不涉及此類重構。
