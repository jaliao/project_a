## Context

`page.tsx` 查詢 `user` 時已 `select: { gender: true }`（目前僅用於 `GenderPromptDialog` 的補填判斷），但沒有查詢 `churchType`/`churchOther`/`church`。所屬教會的三態顯示邏輯已在多處重複實作（`lib/data/friendship.ts`、`lib/data/support-inquiry.ts`、`app/[locale]/(admin)/admin/members/[id]/page.tsx` 等），皆為同一模式：`churchType === 'church' ? church.name : churchType === 'other' ? churchOther : null`，目前沒有共用 helper。性別圖示已有共用元件 `GenderIcon`（`components/shared/gender-icon.tsx`），但文字標籤（男/女/未設定）目前只以 hardcode `aria-label` 呈現、或在 `onboarding` 命名空間內有 `male`/`female` 文案（無 `unspecified`）。

## Goals / Non-Goals

**Goals:**
- 在學員首頁基本資料區塊顯示性別與所屬教會，對所有檢視者一致公開（已與使用者確認）。
- 文案全面走 i18n，不寫死中文。

**Non-Goals:**
- 不抽出跨檔案共用的「教會顯示」helper function——現有重複實作分散在查詢條件略有差異的檔案（有的多判斷 `churchId != null`），本次僅在 `page.tsx` 內就地實作三態判斷，不做跨檔重構（避免範圍擴大到非本次需求的檔案）。
- 不新增性別/教會的編輯功能——本頁本就是唯讀顯示，編輯入口維持在既有的 `/profile` 個人資料編輯頁。

## Decisions

### 1. 查詢補充：`page.tsx` 的 `prisma.user.findUnique` select 新增 `churchType`、`churchOther`、`church: { select: { name: true } }`

與既有 `gender` 一起用於渲染，不新增獨立查詢（同一次 `findUnique` 補欄位即可，無額外 DB round-trip）。

### 2. 渲染位置：基本資料區塊內，Spirit ID 列之後、身分標籤列之前

比照後台會員詳情頁（`admin/members/[id]/page.tsx`）的欄位順序慣例（姓名→性別→...→所屬教會），但前台版面是逐列堆疊（非 `dl` 網格），性別與教會分別各佔一列，置於 Spirit ID 與身分標籤之間：

```tsx
{/* 性別 */}
<div className="flex items-center gap-3">
  <span className="text-sm text-muted-foreground w-20 shrink-0">{t('genderLabel')}</span>
  <GenderIcon gender={user.gender} />
  <span className="text-sm">{t(`gender.${user.gender}`)}</span>
</div>

{/* 所屬教會 */}
<div className="flex items-center gap-3">
  <span className="text-sm text-muted-foreground w-20 shrink-0">{t('churchLabel')}</span>
  <span className="text-sm">{churchLabel}</span>
</div>
```

其中 `churchLabel` 為 server 端算好的字串：`user.churchType === 'church' ? (user.church?.name ?? t('churchUnset')) : user.churchType === 'other' ? (user.churchOther ?? t('churchUnset')) : t('churchUnset')`。

### 3. 性別文字 i18n：於 `studentProfile` 命名空間新增巢狀 `gender` 物件（`male`/`female`/`unspecified`）

不重用 `onboarding` 命名空間的 `male`/`female`（該命名空間語境是填表單，且缺 `unspecified`），避免跨命名空間耦合；於 `studentProfile` 內自成一組，與頁面其餘文案風格一致。

## Risks / Trade-offs

- 性別與所屬教會對所有登入使用者公開（已與使用者確認此為期望行為），與既有「學習進度」「身分標籤」的公開程度一致，風險等同現狀。
