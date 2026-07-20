# Design: cr-spec-260720-002 後台會員詳情顯示招生中課程

## Context

`getMemberDetail`（`lib/data/members.ts`）的學習紀錄（`inviteEnrollments.where.invite.startedAt ≠ null`）與授課紀錄（`courseInvites.where.startedAt ≠ null`）皆排除未開課課程；授課紀錄以 `startedAt desc` 排序。頁面以共用 `CourseSessionCard` 呈現，卡片本身已支援招生中／進行中／已結業／已取消狀態標籤與人數顯示。

## Goals / Non-Goals

**Goals:**
- 會員詳情頁學習／授課紀錄涵蓋招生中課程。
- 排序：招生中（未開課）在前，其後依開課時間新→舊。

**Non-Goals:**
- 不改前台任何頁面；不改課程卡片元件。
- 不顯示學員「待審核（pending）」的報名（學習紀錄僅含已核准）。

## Decisions

### D1：查詢範圍調整（`getMemberDetail`）

- **學習紀錄**：`where` 改為 `{ status: 'approved' }`（移除 `invite.startedAt` 過濾）——招生中課程的已核准報名納入；**待審核報名不列**（明確加上 status 過濾，原程式未過濾 status、僅靠已開課課程幾乎必為 approved 的隱含事實）。
- **授課紀錄**：移除 `where.startedAt` 過濾——建立的所有課程（含招生中、已取消）皆列。

### D2：排序——招生中在前、其後開課時間新→舊

利用 Prisma nulls 排序（`startedAt` null＝未開課＝招生中）：

- 授課紀錄：`orderBy: [{ startedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }]`
- 學習紀錄：`orderBy: { invite: { startedAt: { sort: 'desc', nulls: 'first' } } }`（巢狀關聯排序）；同為招生中者依報名時間為次序即可，不強求。

頁面元件不另行排序（沿用資料層順序）。

### D3：不動 UI 元件

卡片欄位（`cancelledAt`/`completedAt`/`startedAt`/`expiredAt`/人數）select 已齊備，狀態標籤由卡片推導；頁面預期零修改（實作時驗證）。

## Risks / Trade-offs

- [已取消課程進入清單造成雜訊] → 卡片有「已取消」標籤可辨識；管理視角保留全貌較有價值。
- [學習紀錄補上 `status: 'approved'` 可能改變既有清單] → 既有清單僅含已開課課程，其報名實務上皆 approved，無行為變化。

## Migration Plan

無 migration（查詢調整）。

## Open Questions

（無）
