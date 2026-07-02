# cr-spec-260702-005 Design：教材所屬姓名必填與誤植聲明

## Context

學員在課程詳情頁點「申請參加」開啟 `EnrollmentApplicationDialog`（`components/course-session/enrollment-application-dialog.tsx`），選擇教材版本（無須購買／繁體／簡體）；選了需購買版本時顯示「書本名字」欄位：

- 欄位由 `course/[id]/page.tsx` 以 `defaultBookName` prop 預帶（`lib/data/material-items.ts` 的 `defaultBookName()`：中文名 → 英文名 → 匿名）。
- 目前為選填：placeholder「印在書上的名字（留空則用你的姓名）」；送出空白時，伺服端 `applyToCourse`（`app/actions/course-invite.ts`）自行查 user 再套同一預設。
- 文案走 i18n：`course.enroll.bookNameLabel` / `bookNamePlaceholder`（zh-TW / en，zh-CN 由 OpenCC 產生）。
- Dialog 的既有驗證模式為「送出時 toast 提示」（如未選版本時 `course.enroll.selectBook`），未使用 react-hook-form。

系統未上線、無正式資料，不需考慮既有資料相容。

## Goals / Non-Goals

**Goals:**
- 欄位標籤改為「教材所屬姓名」，語意明確（印在教材上的持有人姓名）。
- 選購買版本時該欄位必填：前端阻擋空白送出、伺服端同步驗證拒絕。
- 欄位下方顯示聲明：「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」。
- placeholder 改寫，去除「留空則用你的姓名」。

**Non-Goals:**
- 不改資料模型（仍存 `InviteEnrollment.materialBookName`，上限 100 字不變）。
- 不動老師／管理者端書本項目、寄送批次快照等下游邏輯（僅沿用名詞）。
- 不引入 react-hook-form／Zod 重構此 Dialog（維持現有 toast 驗證模式）。
- 不處理「已送出申請後修改姓名」流程（既有行為不變）。

## Decisions

### D1：i18n key 沿用 `bookName*`，僅改值並新增聲明 key
`course.enroll.bookNameLabel` / `bookNamePlaceholder` 只有此 Dialog 使用。沿用 key 名、只改 zh-TW / en 值，新增 `course.enroll.bookNameNote`（聲明）與 `course.enroll.bookNameRequired`（必填錯誤提示）。

- 替代方案：key 改名為 `materialOwnerName*` 語意更貼切，但需同步改元件取用處且無行為差異，churn 不值得。
- zh-CN 不手改，由 `npm run gen:zh-cn` 重新產生。

### D2：前端必填驗證沿用 Dialog 既有 toast 模式
`handleConfirm` 在 `selected !== 'none'` 且 `bookName.trim()` 為空時 `toast.error(t('course.enroll.bookNameRequired'))` 並中止，與現行「未選版本」的驗證一致；標籤加必填星號。預帶值仍來自 `defaultBookName` prop，學員可清空後必須重填。

- 替代方案：disable 送出按鈕——但欄位僅條件式顯示，disable 條件與版本選擇耦合，toast 模式更一致且改動小。

### D3：伺服端移除空白 fallback，改為拒絕
`applyToCourse` 中 `materialChoice !== 'none'` 且 trim 後為空 → 回傳 `{ success: false, message: '請填寫教材所屬姓名' }`（`message` 為動作層文案、非 i18n key，符合現行慣例）。移除「查 user 套 `defaultBookName()`」的 fallback 分支；`defaultBookName()` 保留，僅供頁面預帶（`page.tsx`）使用。

- 替代方案：伺服端保留 fallback 當保險——但與「必填」語意矛盾（繞過 UI 的空白請求會被默默補值而非被拒），故移除。
- trim + `slice(0, 100)` 上限維持不變。

### D4：聲明文字放欄位下方的 muted 說明列
在 Input 下方以 `text-xs text-muted-foreground` 顯示 `bookNameNote`，僅在欄位顯示（選了購買版本）時出現。不用警示色——屬事前告知，非錯誤狀態。

## Risks / Trade-offs

- [直接打 API 的舊 payload（無 bookName）會從「自動補值」變成「被拒絕」] → 屬預期的 BREAKING 行為；系統未上線、唯一呼叫端是本 Dialog，前端已同步必填，無實際影響。
- [學員把預帶姓名清空後隨意亂填] → 非本次能防；聲明文字已明示誤植費用責任，即為此風險的產品面對策。
- [zh-CN 忘記重新產生] → `prebuild` 會自動跑 `gen:zh-cn`，實作時亦於 tasks 列入。

## Migration Plan

無 schema 變更、無資料遷移。部署即生效；回滾即還原程式碼。

## Open Questions

（無——聲明文案與欄位名由需求方直接給定。）
