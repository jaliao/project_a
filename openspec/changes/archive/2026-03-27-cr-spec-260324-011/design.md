## Context

目前 `CourseSessionCard` 是純展示元件，不含連結。`CourseInvite` 資料模型已有完整的邀請與報名資訊，但缺少詳情頁路由及取消欄位。`InviteEnrollment` 代表學員已接受邀請（建立即視為接受）。

## Goals / Non-Goals

**Goals:**
- 新增 `/course/[id]` 詳情頁，顯示授課老師與已接受學員名單
- 支援取消課程（含取消原因），並將狀態寫入資料庫
- 課程卡片點擊可導航至詳情頁
- 結業申請按鈕（本期僅 UI 佔位，不實作後端流程）

**Non-Goals:**
- 結業申請的後端流程與資料模型
- 課程詳情頁的編輯功能
- 取消課程後的通知信件

## Decisions

### 路由設計：`/course/[id]`
選擇 `/course/[id]` 而非 `/course-sessions/[id]`，更簡潔易記。
`[id]` 為 `CourseInvite.id`（整數自增）。

### 取消狀態表示方式：`cancelledAt` + `cancelReason` 欄位
不新增 status enum，改以 `cancelledAt DateTime?` 判斷是否已取消（非 null = 已取消），`cancelReason String?` 存放取消原因文字。
**理由**：避免引入 status enum 的 migration 複雜度；現有程式碼未依賴 status 欄位，加欄位更安全。

### 取消原因輸入方式
下拉選單（人數不足、時間因素、其他）+ 選「其他」時顯示 textarea。
最終存入資料庫的值：若選預設選項，存選項文字（如「人數不足」）；若選「其他」，存 textarea 輸入值。

### 資料存取：`lib/data/course-sessions.ts` 新增函式
新增 `getCourseSessionById(id)` 函式，包含 `createdBy`（User）與 `enrollments`（InviteEnrollment + User）的 include，供 Server Component 使用。

### Server Action：`app/actions/course-invite.ts`
新建 action 檔，實作 `cancelCourseSession(id, cancelReason)`。
驗證 session → 確認為課程建立者 → 寫入 `cancelledAt` 與 `cancelReason` → revalidatePath。

## Risks / Trade-offs

- [風險] 已取消課程仍顯示在開課列表 → 緩解：詳情頁顯示取消狀態標籤，後續 Sprint 再過濾列表
- [Trade-off] 結業申請僅 UI 佔位 → 接受：避免過早設計未確認的業務流程

## Migration Plan

1. 修改 `prisma/schema/course-invite.prisma`（加 `cancelledAt`、`cancelReason`）
2. 執行 `make schema-update name=add_course_cancel_fields`
3. 部署新路由與元件
4. 修改 `CourseSessionCard` 加入 `href` prop

## Open Questions

- 取消後的課程卡片是否顯示「已取消」標籤？（暫定：詳情頁顯示，列表頁不過濾）
- 結業申請的業務邏輯後續再定義
