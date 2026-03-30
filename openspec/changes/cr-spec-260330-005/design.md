## Context

目前系統的授課流程缺少教材申請與寄送追蹤環節。講師在「招生中」階段可直接點按「開始上課」，實際上並未確保教材已備妥。`CourseOrder` 模型雖已存在（用於建立開課單時填寫的訂購資料），但缺乏後續的寄送狀態欄位。後台管理者目前也無法在 `/admin` 下集中查看教材申請進度。

## Goals / Non-Goals

**Goals:**
- 在課程詳情頁新增「申請教材」入口，預填講師已有的授課資料
- 新增寄送追蹤欄位（`CourseOrder.shippedAt`、`receivedAt`）
- 後台管理者可集中查看所有教材申請及其狀態，並標記已寄送
- 講師確認收件後，「開始上課」按鈕解鎖
- 支援「尚無 CourseOrder」情境——講師可直接從課程詳情頁新建申請

**Non-Goals:**
- 金流付款流程（教材費用追蹤不在本次範圍）
- 學員的教材申請（`InviteEnrollment.materialChoice` 已有獨立機制）
- Email 通知（可由後續 `comm-email` 擴充）

## Decisions

### 1. 直接擴充 CourseOrder，不建新 model

CourseOrder 已包含教材版本、取貨方式等所有必要欄位，只需補充 `shippedAt DateTime?` 與 `receivedAt DateTime?` 即可追蹤狀態。建立新 model 會造成資料重複且無額外收益。

替代方案：建立獨立 `MaterialApplication` model → 棄用，因為 CourseOrder 已有 `courseInvites` 關聯，擴充成本最低。

### 2. 「申請教材」= 建立或檢視已關聯的 CourseOrder

邏輯：
- 若 `CourseInvite.courseOrderId != null`：開啟表單並預填現有 CourseOrder 資料，可覆寫後重新送出（更新）
- 若 `CourseInvite.courseOrderId == null`：開啟空表單（預填來自講師 User profile 的姓名、Email 等），送出後新建 CourseOrder 並關聯至 CourseInvite

預填欄位優先順序：
1. 現有 `CourseOrder`（若已關聯）
2. `CourseInvite.courseDate`（開課日期）
3. `User.profile`（buyerNameZh → realName、email、phone 等）

### 3. 「開始上課」前置條件：receivedAt 非 null

修改 `CourseDetailActions` 的顯示條件：`!isStarted && hasReceivedMaterial`。

`hasReceivedMaterial = courseOrder?.receivedAt != null`

若課程無 CourseOrder，「開始上課」按鈕隱藏，改顯示「請先申請教材」提示。

### 4. 後台管理頁：新增 `/admin/materials` 路由

沿用 `/admin/course-catalog` 的 admin 頁面模式（Server Component + Tailwind Table）。
- 顯示所有 CourseOrder 列表，附帶關聯的 CourseInvite 資訊
- 依狀態篩選（待寄送 / 已寄送 / 已收件）
- 管理者操作：「確認已寄送」按鈕（設定 `shippedAt`）

### 5. Server Actions 設計

| Action | 呼叫方 | 功能 |
|---|---|---|
| `applyMaterialOrder(inviteId, data)` | 講師 | 建立或更新 CourseOrder 並關聯至 CourseInvite |
| `confirmShipment(orderId)` | 管理者 | 設定 `shippedAt = now()` |
| `confirmReceipt(inviteId)` | 講師 | 設定對應 CourseOrder 的 `receivedAt = now()` |

## Risks / Trade-offs

- **CourseOrder 職責擴充**：原本 CourseOrder 是「建課時填的訂購單」，現在也承擔「教材流程追蹤」職責，兩個語意稍有混合。→ 接受此 trade-off，因為欄位完全重疊，日後可透過 view/helper 隔離語意
- **收件確認不可逆**：`receivedAt` 一旦設定，`開始上課` 即解鎖，目前無撤銷機制。→ 可接受，教材收件屬單向事實
- **無 CourseOrder 時阻擋開課**：既有已在進行中的課程（`startedAt != null`）不受影響，只有尚未按下「開始上課」的課程才需要教材確認。→ 邊界條件明確，不會破壞舊資料

## Migration Plan

1. 新增 migration：`ALTER TABLE course_orders ADD COLUMN shipped_at TIMESTAMPTZ, ADD COLUMN received_at TIMESTAMPTZ`
2. 執行 `make schema-update name=add_material_order_status`
3. 現有 CourseOrder 資料的兩欄預設 null，不影響舊課程（`startedAt != null` 的課程 `開始上課` 按鈕本已隱藏）
4. 新條件：`startedAt == null && courseOrder?.receivedAt != null` 才顯示「開始上課」，舊的已進行/已結業課程不受影響

Rollback：移除兩欄位並還原 `CourseDetailActions` 的顯示條件。

## Open Questions

~~- 若講師已申請教材但管理者尚未寄送，課程頁應顯示什麼提示文字？~~ → **已決定**：顯示「教材申請中，等待管理者寄送」

~~- 管理者後台是否需要寄送備註欄位（如宅配單號）？~~ → **已決定**：本次不納入，`shippingNote` 留待後續需求添加
