## Context

`User` 目前有 `realName`（中文真名）、`nickname`（暱稱）、`name`（OAuth 同步名稱）三個名稱欄位，各處顯示邏輯不統一。本 CR 新增 `englishName`、`gender`、`displayNameMode`，並以一個共用 helper 統一全站的顯示名稱規則。

現有個人資料表單（`profile-form.tsx`）使用 React Hook Form + Server Action FormData 模式；可直接在現有表單中新增欄位。

## Goals / Non-Goals

**Goals:**
- 新增三個 User 欄位（英文名、性別、顯示名稱模式）
- `getMemberDisplayName()` helper 統一顯示名稱邏輯，全站一致
- 個人資料頁提供欄位維護 UI
- Seed 全面更新（管理者 email + 20 位會員含完整資料）

**Non-Goals:**
- 不改動課程、訂購等業務邏輯
- 不做顯示名稱的隱私控制（現階段僅顯示偏好，不涉及資料存取控制）
- 不在所有頁面強制替換舊顯示邏輯（高流量業務頁優先替換，其餘保持不壞）

## Decisions

### 1. 顯示名稱 Helper vs 元件

**選擇**：同時提供兩層：
- `lib/utils/member-display.ts` — 純函式 `getMemberDisplayName(user)`，Server Component / 資料層皆可用
- `components/member/member-display-name.tsx` — 薄包裝 Client 元件（僅需要時使用）

**理由**：大多數顯示場景是 Server Component（管理頁、課程頁），純函式即可，不需要 Client Component。只有需要 tooltip 或互動時才需要元件。

### 2. 顯示規則實作

```
function getMemberDisplayName(user):
  anonymousName =
    if mode == 'english': user.englishName || user.name || user.realName
    else:                 user.nickname    || user.realName || user.name

  if !anonymousName && !user.realName: return '（未填）'
  if !user.realName: return anonymousName
  if anonymousName == user.realName: return user.realName
  return `${anonymousName}（${user.realName}）`
```

**括號省略條件**：匿名名稱 === realName（完全相同）時省略括號，只顯示 realName。

### 3. Gender enum

**選擇**：三值 enum：`male` | `female` | `unspecified`（預設 `unspecified`）。

**理由**：強制選擇非必要，預設不填保留彈性。

### 4. displayNameMode enum

**選擇**：兩值 enum：`chinese` | `english`（預設 `chinese`）。

**理由**：簡單明確，未來擴充時可加值。

### 5. Seed 設計

- 20 位成員含 `realName`、`name`、`englishName`、`phone`、`churchId`、`gender`
- 管理者 email 由 `justin@blockcode.com.tw` 改為 `101@iwillshare.org.tw`，spiritId 保持 `PA000001`
- spiritIdCounter 同步至 seq=20
- 指定順序（PA260001–PA260020）：
  1. 黃國倫 Gorden（男）
  2. 吳容銘 Romen（男）
  3. Hilo（男）
  4. Joyce（女）
  5. 湯尼（男）
  6. Johni（男）
  7. KT（男）
  8. 王明台（男）
  9–13. 隨機編寫（5 位）
  14. Justin（男）
  15–20. 隨機編寫（6 位）

### 6. 替換範圍

優先替換：
- `app/(user)/admin/members/` — 管理頁會員名稱
- `components/admin/member-hierarchy-tree.tsx` — 階層樹節點
- `components/course-session/enrolled-students-list.tsx` — 學員清單

不替換（本 CR 範圍外）：
- `app/(user)/course/[id]/` — 課程詳情頁（涉及複雜關聯，另 CR 處理）

## Risks / Trade-offs

- **[Seed 更新管理者 email]** → 已存在的 `justin@blockcode.com.tw` 帳號不影響，upsert by email，新帳號建立在 `101@iwillshare.org.tw`
- **[englishName 可為空]** → 選 `english` 模式但未填英文名時，fallback 至 `name`，再 fallback 至 `realName`，不會顯示空白
- **[部分頁面未替換]** → 舊邏輯仍可運作，不破壞現有功能，未來逐步替換

## Migration Plan

1. 新增 `gender.prisma` 或更新 `user.prisma` 加三欄位
2. `make schema-update name=add_user_profile_fields`
3. 實作 helper + 元件
4. 更新 profile 表單（schema、action、UI）
5. 替換指定範圍的顯示名稱
6. 全面更新 seed.ts
