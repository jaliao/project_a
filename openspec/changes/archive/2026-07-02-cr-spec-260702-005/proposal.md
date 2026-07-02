# cr-spec-260702-005：學員申請教材——「教材所屬姓名」必填與誤植聲明

## Why

學員申請課程教材時，「書本名字」欄位語意不清（易誤解為書籍書名而非印在書上的持有人姓名），且目前選填、留空自動帶預設，導致姓名誤植時權責不明。需改名為「教材所屬姓名」並改為必填，同時明示誤植重申請的費用責任，減少爭議。

## What Changes

- 學員申請參加課程的申購對話框（`EnrollmentApplicationDialog`）中，欄位標籤「書本名字」改為 **「教材所屬姓名」**。
- 該欄位改為**必填**（選擇繁體／簡體版本時）：
  - 仍預帶預設值（中文名 → 英文名），學員可編輯。
  - 送出時若為空白，前端阻擋並提示；伺服端（`applyToCourse`）同步驗證，空白即拒絕（**BREAKING**：移除「留空→伺服端自動帶預設」的 fallback 行為）。
- 欄位下方空白處補上聲明文字：**「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」**。
- placeholder 文案同步調整（現行「留空則用你的姓名」與必填語意矛盾）。
- i18n：更新 `messages/zh-TW.json`／`messages/en.json` 對應 key（`course.enroll.bookName*`、新增聲明 key）；`zh-CN` 由 OpenCC 重新產生。
- 依規範同步更新 `doc/` 三份操作手冊中「書本名字」相關描述與版號。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `enrollment-application`：既有需求「學員申購教材選版本與書本名字」變更——欄位更名「教材所屬姓名」、改必填（空白送出被拒，移除留白採預設之 scenario）、新增誤植費用聲明顯示需求。

## Impact

- **UI**：`components/course-session/enrollment-application-dialog.tsx`（標籤、必填驗證、聲明文字、placeholder）。
- **Server Action**：`app/actions/course-invite.ts` 的 `applyToCourse`（空白拒絕、移除 fallback；`lib/data/material-items.ts` 的 `defaultBookName` 保留供預帶用）。
- **i18n**：`messages/zh-TW.json`、`messages/en.json`（`course.enroll.*`）；`zh-CN` 自動產生。
- **資料模型**：無 schema 變更（仍存 `InviteEnrollment.materialBookName`）。
- **文件**：`doc/學員手冊.md`（申請流程欄位名）、必要時 `doc/老師手冊.md`／`doc/管理者操作手冊.md` 中對應名詞；`config/version.json` patch +1（於 apply 階段）。
- **不影響**：老師／管理者端書本項目、寄送批次之既有快照邏輯（`material-book-items`、`material-multi-address-shipping` 等 spec 僅為名詞沿用，需求未變）。
