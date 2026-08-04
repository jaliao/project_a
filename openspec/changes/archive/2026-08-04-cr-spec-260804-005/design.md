## Context

`MemberTagInfo`（`components/admin/member-tag.tsx`）目前為 `{ id, spiritId, roles, displayName, avatarUrl }`，兩個既有消費端：
- `lib/data/course-order.ts`（教材申請頁「講師」）：`createdBy` select 已含 `realName`，但**未含** `gender`／`church`／`churchOther`，本次需擴充 select。
- `lib/data/certificate.ts`（證書製作頁「學員」）：`enrollments` 查詢的 `user` select **已經**含 `gender`／`church`／`churchOther`／`realName`（`CertificateListItem` 本來就需要這些欄位供自己既有的姓名主標題／性別 icon／單位顯示），只是尚未一併塞進 `member: MemberTagInfo`——這裡不需要新查詢，純粹是組裝時多帶三個既有欄位。

`GenderIcon` 目前是 `certificates/page.tsx` 的模組內函式（未匯出），本次會員標籤也需要同一個 icon 呈現邏輯，抽出為共用元件是自然的最小重構（同一模式已在 `cr-spec-260804-001` 對 `getIdentityTags` 做過一次）。

## Goals / Non-Goals

**Goals:**
- `MemberTagInfo` 擴充為包含單位／性別／真實姓名，供會員標籤／會員文字元件呈現後台核心辨識資訊。
- 會員標籤改為左右兩欄版面，資訊層次更清楚（真實姓名行加強顯示）。
- 會員文字元件文字樣式改為「顯示名稱（真實名稱）」。

**Non-Goals:**
- 不變更操作按鈕的功能行為。
- 不影響身分標籤（`getIdentityTags`）與頭像 fallback（`resolveAvatarUrl`）既有邏輯。

## Decisions

### 新增 `withRealName(displayName, realName)` 共用格式化函式
```ts
// lib/utils/member-display.ts
export function withRealName(displayName: string, realName: string | null): string {
  if (!realName || realName === displayName) return displayName
  return `${displayName}（${realName}）`
}
```
`MemberTag`（顯示名稱行）與 `MemberTextTag`（觸發文字）皆呼叫此函式，避免兩處各自重寫「真實姓名缺漏或與顯示名稱相同時省略括號」的邊界判斷。與既有 `getMemberDisplayName()` 的「基底＋條件式括號後綴」風格一致，但服務不同的組合（`getMemberDisplayName` 是「暱稱＋依 `displayNameMode` 決定的後綴」，`withRealName` 是「顯示名稱＋固定真實姓名後綴」，兩者語意不同、不合併為同一函式）。

### `GenderIcon` 抽出為 `components/shared/gender-icon.tsx`
與 `UserAvatar`（`components/shared/user-avatar.tsx`）同層級，匯出 `Gender` 型別（`'male' | 'female' | 'unspecified'`，對應 Prisma `Gender` enum）與 `GenderIcon` 元件，樣式與既有實作完全相同（藍色♂／粉色♀／淡色中性 icon）。`certificate.ts` 既有的 `CertificateGender` 型別移除，改直接使用共用 `Gender`（兩者結構本就相同，合併避免重複定義）。

### 會員標籤兩欄版面
```tsx
<div className="flex gap-3 rounded-lg border bg-background p-3">
  <UserAvatar size="lg" ... />
  <div className="flex-1 space-y-1">
    <p className="font-mono text-xs text-muted-foreground">{spiritId}</p>
    <p className="text-xs text-muted-foreground">{churchLabel ?? '—'}</p>
    <div className="flex items-center gap-1.5">
      <p className="text-sm font-medium">{withRealName(displayName, realName)}</p>
      <GenderIcon gender={gender} />
    </div>
    <div className="flex flex-wrap gap-1">{/* 身分標籤 */}</div>
    <div className="flex gap-1">{/* 檢視／訊息按鈕 */}</div>
  </div>
</div>
```
「顯示名稱（真實名稱）」用 `text-sm font-medium`，其餘輔助欄位（啟動編號、單位、身分標籤）用 `text-xs text-muted-foreground`，達成票單要求的「比其他稍微清楚」。

### `course-order.ts` 的 `createdBy` select 擴充；`certificate.ts` 僅組裝調整
`course-order.ts` 需要新增 `gender: true`、`church: { select: { name: true } }`、`churchOther: true` 到 `createdBy` select，並在組裝 `instructor` 時計算 `churchLabel`（沿用證書頁既有的 `church?.name ?? churchOther ?? null` 解析順序，維持專案一致慣例）。`certificate.ts` 不需要新查詢，只需在既有 `member` 組裝物件中多帶 `c.user.realName`／`c.gender`／`c.churchLabel`（這三者在目前程式碼中皆已是既有變數）。

## Risks / Trade-offs

- [風險] `MemberTagInfo` 型別新增必填欄位（非 optional），兩個既有消費端若遺漏更新會直接造成 TypeScript 編譯錯誤 → Mitigation：編譯期可完全捕捉，`tsc --noEmit` 會立即攔下遺漏處。
- [風險] 會員標籤兩欄版面較原本略高（多一行單位），教材申請頁展開詳情、證書卡片的既有版面高度會略增 → Mitigation：屬預期內的視覺調整，票單明確要求此版面，非非預期副作用。
