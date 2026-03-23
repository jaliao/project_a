## Context

目前系統有課程訂購（CourseOrder）但缺乏邀請學員的機制。教師需要：
1. 建立一個「開課邀請」，填寫預期人數並取得可分享的邀請連結
2. 學員點擊連結、登入後在首頁確認加入
3. 教師追蹤每個邀請下的學員報名狀態

邀請連結需要在未登入狀態下可存取（觸發登入），登入後自動完成加入流程。

## Goals / Non-Goals

**Goals:**
- 教師建立邀請 → 產生唯一 token → 複製連結
- 學員訪問 `/invite/[token]` → 未登入導向登入（保留 callbackUrl）→ 登入後首頁顯示確認 Dialog
- 確認後建立 `InviteEnrollment` 記錄（enrolled）
- 教師查看邀請進度：已邀請人數 vs 已確認，逐一學員狀態

**Non-Goals:**
- 邀請到期設定（本次 token 永久有效）
- Email 通知學員（後續 CR）
- 學員拒絕加入後的處理流程
- Email 通知學員（後續 CR）

## Decisions

### 1. 邀請連結路由：`/invite/[token]`（獨立 public 頁面）
**選擇**：新增 `app/invite/[token]/page.tsx`，加入 middleware 公開白名單。
**理由**：URL 語義清晰（`/invite/ABC123`）；使用 `callbackUrl=/invite/[token]` 讓 middleware 在登入後自動導回，由該頁面執行加入邏輯後 redirect 至 `/dashboard?enrolled=1`。
**替代方案**：query param（`/dashboard?invite=ABC123`）— 需修改 dashboard 偵測邏輯，語義較不明確。

### 2. 確認 Dialog 觸發：`/dashboard?enrolled=1` + `searchParams`
**選擇**：`/invite/[token]` 處理完加入後 redirect 至 `/dashboard?enrolled=1`，dashboard Server Component 讀取 searchParams，若存在則傳 prop 給 Client 元件顯示「已加入課程」提示。
**理由**：避免 localStorage 或 global state；Server Component 讀 searchParams 最簡單。

### 3. Token 產生：`crypto.randomBytes(6).toString('hex')`（12 字元 hex）
**選擇**：使用 Node.js 內建 crypto，不引入 nanoid。
**理由**：系統已用 crypto 產生 email token，保持一致，無新依賴。

### 4. 資料模型：`CourseInvite` 關聯 `CourseOrder`
```
CourseInvite {
  id            Int (autoincrement)
  token         String (unique, 12-char hex)
  title         String        // 課程名稱（教師自訂）
  maxCount      Int           // 預計人數
  courseOrderId Int?          // 關聯 CourseOrder（選填）
  createdById   String        // 建立教師 (User.id)
  createdAt     DateTime
}

InviteEnrollment {
  id        Int (autoincrement)
  inviteId  Int
  userId    String  // 學員 User.id
  joinedAt  DateTime
  @@unique([inviteId, userId])  // 同一邀請不能重複加入
}
```
**`courseOrderId` 為選填（nullable FK）**：教師可在建立邀請時選擇關聯的 CourseOrder，也可不關聯（彈性保留）。
**理由**：CourseOrder 記錄教材採購，CourseInvite 記錄開課邀請，兩者在同一次課程中自然關聯；選填設計允許先建邀請再補單，或純邀請不採購的場景。

### 5. 邀請進度頁：`/invites`（獨立路由）或 Dashboard 卡片
**選擇**：新增 `/invites` 路由，列出教師建立的所有邀請及各邀請的報名進度。
**理由**：進度資料較多，獨立頁面比 Dashboard 卡片更易擴充。Dashboard 加入「查看邀請進度」快捷連結即可。

### 6. 邀請建立入口：Dashboard 快速操作按鈕
**選擇**：Dashboard 新增「開課邀請」按鈕（開啟 Dialog），與「新增課程」並列。
**理由**：教師完成訂購後的自然下一步；不放 Topbar 以保持 Topbar 簡潔。

## Risks / Trade-offs

- **Token 碰撞**：12-char hex 有 281 兆種組合，實際碰撞機率可忽略；insert 時加 unique constraint 即可捕捉極端情況
- **重複加入**：`@@unique([inviteId, userId])` 防止同一學員重複加入同一邀請
- **邀請連結無到期**：惡意分享無法撤銷；後續 CR 可加 `expiresAt` 欄位
- **未登入學員 callbackUrl**：middleware 已支援 `callbackUrl`，登入後自動導回 `/invite/[token]`；Google OAuth 同樣透過 `callbackUrl` 傳遞

## Migration Plan

1. 新增 `prisma/schema/course-invite.prisma`
2. 執行 `make schema-update name=add_course_invite`
3. 新增 `/invite/[token]` 至 middleware 公開白名單

## Open Questions

- 邀請進度頁是否需要分頁？（本次假設邀請數量少，不加分頁）
- 建立邀請時 CourseOrder 選單應顯示哪些訂單？（建議：顯示當前登入使用者提交的訂單）
