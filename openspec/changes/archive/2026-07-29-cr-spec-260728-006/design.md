## Context

`graduateCourse`（`app/actions/course-invite.ts:392-516`）結業當下寫入三處資料：①該課所有選為結業的 `InviteEnrollment.graduatedAt`（未結業者寫 `nonGraduateReason`）②`CourseInvite.completedAt`／`gradRating`／`gradTestimony` ③非交易的 best-effort 通知＋結業信（`sendGraduationEmail`，已寄出無法收回）。目前沒有任何路徑可清除 `completedAt`。

「進行中退回招生中」已有 `reopenRecruitment`（`app/actions/course-session.ts:256-280`）與對應 UI「重新招募作業」區塊（`course-detail-actions.tsx:590-623`，i18n `course.actions.*`）可直接參照其模式：權限（該課建立者或 `canAccessAdmin`）、確認 Dialog、`router.refresh()`、不寄信不寫 LOG。

## Goals / Non-Goals

**Goals:**
- 新增「結業回退」：已結業課程可退回進行中，講師與管理者皆可操作。
- 完整復原結業寫入的資料：`CourseInvite.completedAt`／`gradRating`／`gradTestimony` 清空；該課全部 `InviteEnrollment.graduatedAt`／`nonGraduateReason` 清空（回到 approved、未結業）。
- 確認視窗明確提示：已寄出的結業信無法收回，若日後重新結業將對同一批學員再寄一次。

**Non-Goals:**
- 不處理已產生的實體證書（`CertificateProduction`，以 `userId`+`courseCatalogId` 為鍵、不綁定單一班級），沿用既有後台證書管理機制，管理者可自行處理。
- 不嘗試收回或撤銷已寄出的結業信。
- 不影響「重新招募作業」既有邏輯（不修改 `reopenRecruitment`）。

## Decisions

- **新增 server action `revertGraduation(inviteId)`**，放在 `app/actions/course-invite.ts`（與 `graduateCourse`同檔案相鄰，語意對稱）。
- **權限與守衛**：比照 `graduateCourse`——`invite.createdById === session.user.id || canAccessAdmin(session.user.roles)`；要求 `invite.completedAt != null` 且 `invite.cancelledAt == null`，否則拒絕（訊息：`僅已結業的課程可退回進行中`）。
- **交易範圍**：單一 `$transaction`——`courseInvite.update({ completedAt: null, gradRating: null, gradTestimony: null })` ＋ `inviteEnrollment.updateMany({ where: { inviteId }, data: { graduatedAt: null, nonGraduateReason: null } })`。以 `inviteId` 範圍清除，不篩選特定學員，確保與課程結業狀態完全對稱（含事後透過「新增學員」補登結業之學員）。
- **不寄信、不建立通知、不寫操作 LOG**：比照 `reopenRecruitment` 的既有慣例（該函式本身即明確排除通知與 LOG），維持兩個「狀態退回」操作行為一致。
- **UI**：`course-detail-actions.tsx` 新增區塊，比照「重新招募作業」的 `Section`／確認 Dialog 結構，僅於 `isCompleted` 時顯示（該元件本身已僅限 `isInstructor || isAdmin` 渲染，見 `page.tsx:417-422`）。確認 Dialog 第二行文字明確警示結業信無法收回、重新結業會重複寄信。
- **i18n**：新增鍵值於既有 `course.actions` 命名空間（與 `sectionReopen` 等並列）：`sectionRevert`／`revertDesc`／`revertButton`／`revertConfirmTitle`／`revertConfirmLine1`／`revertConfirmLine2`／`revertSuccessFallback`。

## Risks / Trade-offs

- [風險] 清除全部學員 `graduatedAt` 屬破壞性操作（不可逆，無備份機制）→ Mitigation：確認 Dialog 明確列出將被清除的內容（結業標記、評分心得），操作者需主動確認；不提供復原此次退回的功能（與 `reopenRecruitment` 一致的單向操作設計）。
- [風險] 退回後重新結業會對同一批學員重複寄送結業信 → Mitigation：確認視窗明確警示此風險（proposal 已確認要加），不在程式層面做防重複寄信邏輯（超出本次範圍）。
- [風險] 已產生的實體證書／證書資格佇列不會因退回而改變（`CertificateProduction` 不綁定 `inviteId`）→ Mitigation：proposal 已明確排除此範圍，說明文字不承諾自動處理證書。
