## Context

開發／測試環境常需重現「講師帶 5 位學員、啟動靈人課程、教材尚未送出」的情境以測試後續流程（開課、結業、教材寄送等）。目前需手動新增授課並逐一建立／報名 5 個帳號，繁瑣易錯。

現有相關元件與資料：
- 「新增授課」入口：`components/course-session/course-session-dialog.tsx`，於 `app/(user)/user/[spiritId]/page.tsx` 渲染。
- 既有授課建立 Server Action：`app/actions/course-session.ts`（`createCourseSession`）。
- 資料模型：`CourseInvite`（授課）、`InviteEnrollment`（報名，`status`/`materialChoice`）、`User`（`email` 為唯一必填，其餘皆可空或有預設）。
- `spiritId` 由 `lib/spirit-id.ts` 的 `generateSpiritId()` 透過 `SpiritIdCounter` 交易核發。
- 既有測試環境判斷慣例：`process.env.NODE_ENV === 'development'`（見 `course-session-form.tsx`、`step-2-basic-info.tsx`）。

## Goals / Non-Goals

**Goals:**
- 提供僅在開發環境出現、緊鄰「新增授課」的「新增測試授課」一鍵按鈕。
- 一次建立：1 筆啟動靈人 `CourseInvite`（待開課）＋ 5 位動態建立的臨時測試 `User` ＋ 5 筆 `approved` `InviteEnrollment`，不建立 `CourseOrder`。
- Server Action 具 production 守衛與登入驗證（深度防禦）。

**Non-Goals:**
- 不提供臨時測試資料的清理／回收 UI（本次不做）。
- 不修改既有 `createCourseSession` 或授課建立規格。
- 不在 production 提供任何此功能。
- 不建立教材訂購（`CourseOrder`）或寄送流程資料。

## Decisions

### 1. 環境閘控：沿用 `NODE_ENV === 'development'`，UI 與 Server Action 雙重把關
- UI：按鈕僅於 `NODE_ENV === 'development'` 渲染（與既有 `isDev` 慣例一致）。
- Server Action：函式開頭再次檢查 `process.env.NODE_ENV === 'production'` 即拒絕，避免僅靠前端隱藏。
- 替代方案：改用 `NEXT_PUBLIC_ENV`。不採用，因現有程式碼皆以 `NODE_ENV` 判斷，保持一致最省心智負擔。

### 2. 臨時測試學員的建立方式
- 每次點擊動態建立 5 位新 `User`，欄位：
  - `email`：保證唯一，格式 `test-stu-{timestamp}-{index}@test.local`（`timestamp` 為毫秒、`index` 0–4）。
  - `realName` / `name`：`測試學員{timestamp}-{index}` 之類可辨識字串。
  - `spiritId`：呼叫 `generateSpiritId()` 核發（每位一次，共 5 次）。
  - 其餘沿用 model 預設（`role=user`、`learningLevel=0` 等）。
- 替代方案：沿用既有 seed 測試帳號。不採用（使用者已選擇動態建立），因 seed 帳號數量有限、且重複點擊會與既有報名衝突。

### 3. 交易與一致性
- 在單一 `prisma.$transaction()` 內建立 `CourseInvite` 與 5 筆 `InviteEnrollment`，確保半途失敗不留下孤兒資料。
- `spiritId` 核發（`generateSpiritId()`）本身含交易，於外層交易前先取得 5 個 spiritId，再於主交易建立 user/invite/enrollment，降低巢狀交易複雜度。
- `InviteEnrollment`：`status = approved`、`materialChoice = none`。
- `CourseInvite`：`courseCatalogId = 1`、`maxCount = 5`、`title` 預設「測試授課 - 啟動靈人」、`createdById` 為當前使用者、`courseOrderId = null`、`startedAt/cancelledAt/completedAt` 皆 null。

### 4. UI 落點
- 不改動既有 `CourseSessionDialog`；新增獨立的測試按鈕元件（client component），與「新增授課」並排於 `app/(user)/user/[spiritId]/page.tsx`，由頁面以 `isDev` 條件渲染。
- 成功後以 toast 提示，並 `revalidatePath` 重整授課清單。

## Risks / Trade-offs

- [動態建立的臨時 User 會殘留於開發 DB] → 可接受；僅限開發環境，必要時以 `make clean`／重新 seed 清除。本次不做清理 UI。
- [`generateSpiritId()` 會消耗 `SpiritIdCounter` 序號] → 僅影響開發環境序號連續性，無實質影響。
- [`courseCatalogId = 1` 假設啟動靈人固定為 1] → 與現有程式（`lib/data/hierarchy.ts` 的 `SPIRIT_COURSE_ID = 1`）一致，風險低。
- [Server Action 若被遺漏守衛而部署至 production] → 以「UI 隱藏 + 函式內 `NODE_ENV` 拒絕」雙重防禦降低風險。

## Migration Plan

- 純新增功能，無 schema 變更、無資料遷移。
- 部署後於開發環境驗證按鈕出現且可建立資料；production 驗證按鈕不出現、且直接呼叫 action 被拒。
- 回滾：移除按鈕與 Server Action 即可，無殘留結構。

## Open Questions

- 無。學員來源、教材狀態、生命週期狀態與環境閘控已於 proposal 階段確認。
