## Why

證書製作卡片目前於「學員」列下方顯示「顯示名稱」列，屬於學員自身資訊的重複呈現（學員的顯示名稱已可經「學員」列的會員文字元件查閱）。管理者製作證書時更需要快速辨識該學員是由哪位老師的課程結業，目前卡片上完全沒有老師資訊。

## What Changes

- 證書製作卡片 SHALL 在「學員」列下方新增「老師」列，取代原本的「顯示名稱」列（同一位置）。
- 「老師」列 SHALL 以「會員文字元件」（`admin-member-tag`，同「學員」列使用的元件）呈現：該學員所屬課程邀請（`CourseInvite`）的建立者（講師），顯示其啟動編號與顯示名稱，點擊展開完整會員標籤可檢視/傳訊息。
- 原「顯示名稱」列自卡片移除（不再獨立顯示；學員自身顯示名稱仍可經「學員」列的會員文字元件查閱）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `admin-certificate-production`：新增「證書卡片老師列使用會員文字元件」需求（ADDED）；修改「待製作證書清單」需求的卡片欄位列表（MODIFIED，移除「顯示名稱」欄位、新增「老師」欄位）

## Impact

- **UI**：`app/[locale]/(admin)/admin/certificates/page.tsx` 卡片欄位區塊，移除「顯示名稱：」列，新增「老師：」列（`<MemberTextTag {...it.teacher} />`），位置緊接於「學員」列之後。
- **Data Layer**：`lib/data/certificate.ts`
  - `enrollments` 查詢的 `invite` select 需新增 `createdBy`（同 `course-order.ts` 既有 `instructor` 所需欄位：`id`/`spiritId`/`roles`/`realName`/`name`/`email`/`nickname`/`englishName`/`displayNameMode`/`avatarKey`/`image`/`gender`/`church`/`churchOther`）。
  - `Eligible`／`CertificateListItem` 新增 `teacher: MemberTagInfo`，組裝邏輯比照 `course-order.ts` 的 `instructor` 欄位（`churchLabel` 解析順序：`church?.name ?? churchOther ?? null`）。
- **不修改**：`displayName` 欄位本身（`CertificateListItem.displayName`）保留於型別中（人名搜尋仍會用到），僅卡片 UI 不再獨立列出該欄位一行。

## Non-Goals

- 不變更「學員」列既有的會員文字元件呈現方式或資料來源。
- 不處理教材申請頁（`admin/materials`）既有的講師會員標籤呈現（該處維持現狀）。
