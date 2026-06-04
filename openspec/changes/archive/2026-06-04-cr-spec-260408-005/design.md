## Context

會員管理頁目前無匯出功能，欄位順序為姓名→Email→啟動編號→加入日期。需新增 Excel 匯出並調整欄位順序為啟動編號優先。

## Goals / Non-Goals

**Goals:**
- 表格欄位順序：啟動編號移至第一欄
- 兩個匯出按鈕：「匯出目前 N 筆」（帶 ?q=）、「匯出全部」（無 ?q=）
- Route Handler 生成 .xlsx 回傳下載
- 匯出欄位完整（12 欄，包含電話、教會、學習等級等）

**Non-Goals:**
- 不支援 CSV（僅 xlsx）
- 不分頁（一次全部匯出）
- 不做自訂欄位選擇

## Decisions

### D1：Route Handler（`/api/admin/members/export`）

**選擇**：使用 Next.js Route Handler（`app/api/admin/members/export/route.ts`）生成 xlsx。
- `GET ?q=` → 篩選匯出
- `GET`（無 q）→ 全部匯出
- 在 handler 內驗證 session + admin role
- 回傳 `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，`Content-Disposition: attachment; filename="members-YYYY-MM-DD.xlsx"`

**替代方案：** 客戶端用 SheetJS 直接生成 → 需把資料傳到 Client Component，增加 bundle size，不選。

### D2：使用 `xlsx`（SheetJS）套件

`xlsx` 是最廣泛使用的 Node.js Excel 生成套件，支援 Buffer 輸出，適合 Route Handler 使用。

### D3：匯出欄位定義（依序）

| 欄位 | 來源 |
|------|------|
| 啟動編號 | `spiritId` |
| 真實姓名 | `realName` |
| 英文名稱 | `englishName` |
| 暱稱 | `nickname` |
| Email | `email` |
| 通訊Email | `commEmail` |
| 手機 | `phone` |
| 性別 | `gender`（male→男 / female→女 / unspecified→未指定） |
| 角色 | `role`（user→會員 / admin→管理員 / superadmin→超級管理員） |
| 所屬教會 | `church.name` 或 `churchOther` 或 `churchType` |
| 學習等級 | `learningLevel` |
| 加入日期 | `createdAt`（YYYY/MM/DD） |
| 最後登入 | `lastLoginAt`（YYYY/MM/DD，空則留空） |

### D4：matchExportMembers 新增至 lib/data/members.ts

`exportMembers(q?)` 回傳完整欄位（select 比 searchMembers 多），避免讓搜尋查詢過度 select。

### D5：按鈕放在頁面右上角，與「N 位會員」同排

「匯出 {N} 筆」（帶 ?q= 連結）與「匯出全部」（無 ?q= 連結）以 `<a>` 標籤實現，直接觸發 Route Handler 下載。

## Risks / Trade-offs

- **大量資料**：Route Handler 一次查全部，若會員數極多（>10k）可能稍慢。目前規模無此問題。
- **xlsx bundle**：Route Handler 在 Node.js runtime，不影響客戶端 bundle。

## Migration Plan

1. 安裝 `xlsx`
2. 新增 `exportMembers()` 至 `lib/data/members.ts`
3. 新增 `app/api/admin/members/export/route.ts`
4. 修改 `app/(user)/admin/members/page.tsx`：欄位順序 + 匯出按鈕
