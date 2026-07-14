# cr-spec-260714-002 Design

## Context

實際名冊修復需求（遺漏學員、重複帳號搬課、同名拆帳、換班移除）都收斂為「管理員對班級新增／移除報名（`InviteEnrollment`）」兩個原子操作。現況：

- 後台已有 `/admin/course-sessions` 開課管理列表（狀態下拉、篩選），但無班級編號欄、無學員管理。
- 後台已有「新增會員」機制（`app/actions/admin.ts` 的 `createMember`）：核發 spiritId、產生臨時密碼（bcrypt、`isTempPassword=true`）、加入白名單、臨時密碼一次性顯示供轉交。
- `InviteEnrollment` 有 `@@unique([inviteId, userId])`；`MaterialShipmentItem.enrollmentId` 外鍵**無 cascade**（刪報名前須檢查）。
- 證書待製作清單、師生階層、擋修皆由「已結業報名（`graduatedAt != null`）」動態推導；`CertificateProduction` 另以 `userId×courseCatalogId` 記錄製作狀態。
- 系統目前**沒有**任何管理操作 audit log 模型。
- 補建結業的既有慣例（`learning-record-backfill-admin`）：班級未結業時補 `completedAt`，`joinedAt` 對齊結業日避免「入班晚於結業」。

## Goals / Non-Goals

**Goals:**

- 管理員可對任一班級新增學員（掛既有帳號或建新帳號）與移除學員，含補登結業。
- 開課管理與學員管理介面顯示班級編號（`CourseInvite.id`）。
- 學員新增／移除留下可查詢的管理操作紀錄，且紀錄不因會員/班級後續刪除而遺失可讀性。

**Non-Goals:**

- 帳號合併（重複帳號以「新增＋移除」搬課、舊帳號用既有會員暫停處理）。
- `CertificateProduction` 製作紀錄／教材訂單（`CourseOrder`）搬移。
- 回溯記錄其他既有後台操作（會員暫停、狀態變更等）到操作紀錄。
- 學員/講師通知信或 Inbox 通知。

## Decisions

### D1. 入口＝卡片右上角「⋯」選單；學員管理為獨立頁另開視窗

開課管理列表每班卡片**右上角加「⋯」按鈕**（`DropdownMenu`），選單項依序：

1. **新增學員** → 另開視窗至 `/admin/course-sessions/[id]/students?action=add`（學員管理頁並自動開啟新增表單）
2. **移除學員** → 另開視窗至 `/admin/course-sessions/[id]/students`（於學員清單逐筆移除）
3. **變更課程狀態** → 原地開啟 dialog（沿用既有狀態規則：招生中／進行中／已取消、不可選已結業），取代原 inline 狀態下拉
4. **查詢 LOG** → 另開視窗至 `/admin/operation-logs?inviteId={id}`（預先以該班過濾）

**連到獨立頁面的選單項一律 `target="_blank"` 另開視窗**（新增／移除學員、查詢 LOG）；變更課程狀態非獨立頁面，原地 dialog。

學員管理頁 `/admin/course-sessions/[id]/students`：頁首顯示班級編號＋課程名稱＋講師＋狀態，下方為學員卡片清單（手機優先）＋「新增學員」按鈕。
**為何不用 dialog 做學員管理**：清單＋新增表單＋逐筆移除的資訊量在手機上以頁面呈現較穩；也保留之後擴充（如批次）的空間。頁面位於 `(admin)` group，不另寫守衛。

### D2. 新增學員沿用 `createMember` 核心，抽共用 helper

`createMember` 的建帳號邏輯（spiritId＋臨時密碼＋白名單）抽成可於 transaction 內呼叫的共用函式（如 `lib/utils/member-creation.ts` 或 action 內部共用），新 action `addStudentToInvite` 流程：

1. `auth()`＋`canAccessAdmin`；Zod 驗證（姓名、email、可選結業日）。
2. 以 email（lowercase）查 `User`：
   - **存在**→ 掛該帳號報名。UI 端在送出前先以查詢 API 顯示「將加入既有會員：{姓名}（{啟動編號}）」供確認，避免掛錯人。
   - **不存在**→ 交易內建帳號（同 `createMember` 語意），成功後臨時密碼一次性顯示。
3. 建 `InviteEnrollment`（`status=approved`）。重複報名由 unique 約束＋事前查詢擋下，回欄位錯誤。
4. **補登結業**（勾選時）：`graduatedAt=指定日`、`joinedAt=指定日`（比照 backfill 慣例避免入班晚於結業）；班級 `completedAt` 為空則同交易補為同日。未勾選：`joinedAt=now`，不動班級狀態。
5. 同交易寫入操作紀錄；`revalidatePath`。

**為何沿用臨時密碼而非無密碼＋找回帳號**：機制已存在且管理者已熟悉（會員管理同流程）、學員拿到密碼即可登入，不依賴信箱收信成功。

### D3. 移除學員＝實體刪除＋防呆，不做軟刪除

`removeStudentFromInvite`：

1. 權限＋載入報名（含 `_count.shipmentItems`、`graduatedAt`）。
2. `shipmentItems > 0` → 拒絕：「該報名已有教材寄送紀錄，請先至教材管理處理」。
3. 已結業報名：UI 以醒目確認對話框警示（影響證書待製作、師生階層、擋修資格）；server 不擋（管理者確認即刪）。
4. 交易內刪除報名＋寫操作紀錄；`revalidatePath`。

**為何實體刪除**：報名列本身即是要修復的錯誤資料（掛錯人／換班），保留軟刪除旗標會汙染所有以 enrollment 推導的查詢（證書、階層、擋修、名單）。可追溯性由操作紀錄（含快照）承擔。
**已知副作用**：刪除已結業報名後，若該人該階層無其他結業報名，證書待製作卡片消失；既有 `CertificateProduction` 紀錄成為孤兒但無害（清單以報名為準）。不主動清除。

### D4. `AdminActionLog`：optional FK＋文字快照

新 schema 檔 `prisma/schema/admin-log.prisma`：

```prisma
model AdminActionLog {
  id           Int      @id @default(autoincrement())
  action       String   // enrollment_add / enrollment_remove
  actorId      String?  @db.Uuid   // onDelete: SetNull
  targetUserId String?  @db.Uuid   // onDelete: SetNull
  inviteId     Int?                // onDelete: SetNull
  actorName    String   // 快照：操作管理者姓名
  targetName   String   // 快照：對象學員姓名（含 email）
  inviteTitle  String   // 快照：班級編號＋課程名稱
  detail       String?  // 摘要（如「補登結業 2025/09/01」「移除已結業報名」）
  createdAt    DateTime @default(now())
}
```

**為何 FK 全部 optional＋SetNull＋快照欄**：系統已有「會員刪除」功能，audit log 必須在對象被刪後仍可讀；cascade 會滅證、restrict 會擋合法刪除。快照文字讓查詢頁不依賴 join 也能完整呈現。
**為何 `action` 用 String 不用 enum**：本次僅兩種動作，用 enum 之後每加一種動作都要 migration；以 config-driven 常數（`config/` 模式）約束值域即可。

### D5. 操作紀錄查詢頁 `/admin/operation-logs`

最新在前、每頁 30 筆分頁（比照證書頁），欄位：時間、操作者、動作、班級、對象、摘要。後台 dashboard 功能格加入口。支援 `?inviteId=` 查詢參數過濾單一班級（供卡片「查詢 LOG」選單項另開視窗使用）；其餘篩選本次不做，保留之後擴充。

### D6. 班級編號顯示

開課管理列表加「編號」欄（`#123` 樣式，手機卡片亦顯示）；學員管理頁頁首與操作紀錄 `inviteTitle` 快照一律含編號。無 schema 變更（`CourseInvite.id` 既有）。

## Risks / Trade-offs

- [掛錯既有帳號（同 email 打錯）] → 送出前顯示既有會員姓名＋啟動編號確認列；操作紀錄可追溯、可再移除。
- [補登結業補了 `completedAt`，影響整班狀態顯示] → 與 `learning-record-backfill-admin` 既有慣例一致；UI 於勾選時提示「班級未結業將一併標記結業」。
- [刪除已結業報名牽動證書/階層/擋修] → 醒目確認對話框列明影響；操作紀錄留存快照。
- [`User.learningLevel` 為 seed 靜態欄位，補登結業不會更新] → 既有結業流程（`graduateCourse`）同樣不更新，本功能維持一致、不處理；階層與擋修實際以報名動態推導，不受影響。
- [operation-log 無篩選，量大後難查] → 本次範圍僅兩種動作、量小；schema 已含可篩欄位（action、inviteId、targetUserId），之後加 UI 即可。

## Migration Plan

1. `make schema-update name=add_admin_action_log`（新增表，無破壞性）。
2. 部署程式；無資料回填需求（系統未上線，且 log 由零開始合理）。
3. 回滾：drop 該 migration 即可，不影響既有資料。

## Open Questions

- 無（教材寄送關聯的報名先擋下、由管理者先處理教材，已在 D3 定案）。
