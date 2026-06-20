## Context

顯示名稱邏輯已有雛形（`lib/utils/member-display.ts` 的 `getMemberDisplayName`、`components/member/member-display-name.tsx` 的 `MemberDisplayName`），但：規則用語為「匿名」、退回鏈含 `name`/`email`、模式僅 `chinese`/`english`，且多處 UI 仍直接拼接 `name ?? email`。本變更將顯示名稱訂為系統標準（資安/隱私），統一規則、三模式、標準元件與全站呼叫點。Email 不在限制內（聯繫用途仍顯示）。系統未上線，開發資料庫可重建，免既有資料遷移。

## Goals / Non-Goals

**Goals:**
- `DisplayNameMode` 改為 `nickname`（預設）/`nickname_zh`/`nickname_en`。
- 重寫 `getMemberDisplayName`：基底 `nickname → realName → englishName`，模式加註 `（realName）`/`（englishName）`，空或同基底則省略括號；名稱全空為「（未填）」，不退回 email。
- 全站人名顯示改用 `MemberDisplayName`/`getMemberDisplayName`；移除 `name ?? email`、`realName ?? name` 等拼接。
- 個人資料「顯示名稱方式」三選項、用「暱稱」用語、即時預覽。

**Non-Goals:**
- 不變更 Email 的顯示（聯繫用途保留）。
- 不調整 `realName`/`englishName`/`nickname` 欄位本身與其驗證（暱稱長度等沿用）。
- 不動師生關係、權限等非顯示邏輯。

## Decisions

### 1. Enum 值：`nickname` / `nickname_zh` / `nickname_en`（預設 `nickname`）
- 與規格用語一致、自我描述；`_zh`/`_en` 表括號內附註中文/英文名稱。
- 替代：沿用 `chinese`/`english` — 無法表達「僅暱稱」預設模式，且語意已變（基底改為暱稱），不採用。

### 2. 退回鏈移除 `name` 與 `email`
- 顯示基底僅 `nickname → realName → englishName`。OAuth 的 `name`（可能為真實姓名）與 `email` 皆移出名稱鏈；全空顯示「（未填）」。
- 資安考量：避免在使用者選擇暱稱顯示時，因欄位空而洩漏真實姓名或 Email。

### 3. `getMemberDisplayName` 重寫
```
base = nickname || realName || englishName || ''
if (!base) return '（未填）'
suffix =
  mode === 'nickname_zh' ? realName :
  mode === 'nickname_en' ? englishName : ''
if (!suffix || suffix === base) return base
return `${base}（${suffix}）`
```
- 型別 `displayNameMode?: 'nickname' | 'nickname_zh' | 'nickname_en' | null`，預設 `nickname`。
- 移除註解中「匿名名稱」用語。

### 4. 全站呼叫點稽核（系統標準）
以 `MemberDisplayName`/`getMemberDisplayName` 取代直接名稱拼接。已知待改：
- 課程：`app/(user)/course/[id]/page.tsx`（已結業/未結業/學員清單）、`pending-enrollment-list.tsx`、`components/course-session/enrolled-students-list.tsx`、`app/(user)/course/[id]/instructor-feedback-button.tsx`（studentName 來源）。
- 後台：`app/(user)/admin/members/page.tsx`、`[id]/page.tsx`、`components/admin/member-hierarchy-tree.tsx`。
- 其他：`app/(user)/invites/page.tsx`、`learning/page.tsx`、`lib/data/course-message.ts`（留言作者名）。
- 資料層需確保有提供 `nickname`/`realName`/`englishName`/`displayNameMode`；缺欄位處補 select。Email 維持原樣顯示。
- 驗收：全域搜尋 `\.name ?? .*email`、`realName ?? .*name`、`\.user\.name` 等樣式，確認無漏。

### 5. 個人資料表單與 schema
- `lib/schemas/profile.ts` 的 `displayNameMode` 由 `z.enum(['chinese','english'])` 改為 `z.enum(['nickname','nickname_zh','nickname_en'])`，預設 `nickname`。
- 兩個 profile-form（`app/(user)/profile/`、`app/(user)/user/[spiritId]/profile/`）：三選項、文案改「暱稱…」、`displayNameMode` 型別更新；預覽沿用 `getMemberDisplayName`。

### 6. Seed 與 migration
- `prisma/schema/user.prisma`：`DisplayNameMode` 改三值、`@default(nickname)`。
- migration：未上線採重建（`make prisma-dev-deploy`/手寫 migration），既有 `chinese`/`english` 不保證對應，重建後預設 `nickname`。
- `prisma/seed.ts` 若設定 `displayNameMode` 改用新值（或移除改吃預設）。

## Risks / Trade-offs

- [enum 破壞性變更，既有列含 `chinese`/`english`] → 未上線、開發 DB 重建；正式前無資料。migration 採重建而非線上轉換。
- [呼叫點遺漏導致仍洩漏真名/Email] → 以全域樣式搜尋稽核 + PR review；新元件為唯一出口，後續新功能沿用。
- [資料層缺名稱欄位] → 改用元件處需確認 select 含 `nickname`/`realName`/`englishName`/`displayNameMode`，否則顯示退化；逐處補齊。
- [Email 仍顯示與「隱私」的界線] → 依使用者澄清：Email 為聯繫用途允許顯示，僅名稱受限。

## Migration Plan

1. 改 `DisplayNameMode` enum + 預設；產生/套用 migration、重生 client。
2. 重寫 `getMemberDisplayName`、更新 `MemberDisplayName` 型別。
3. 更新 `lib/schemas/profile.ts` 與兩個 profile-form（三選項、暱稱用語）。
4. 稽核並改寫全站人名顯示呼叫點；補資料層 select。
5. `prisma/seed.ts` 對齊；必要時重建驗證。
6. 同步 `config/version.json`、`README-AI.md`、`doc/學員手冊.md`/`doc/管理者操作手冊.md`。

回滾：開發階段重建即可；元件/工具為單一出口，回退影響面集中。

## Open Questions

- 既有 `chinese`/`english` 是否需保留近似對應（chinese→nickname_zh、english→nickname_en）以利日後線上遷移範本。預設：本期不保留，重建為 `nickname`；若需上線遷移再補 migration 對應。
