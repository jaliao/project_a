## Why

後台證書製作頁（`/admin/certificates`）目前每張卡片只顯示學員自身資訊，管理者製作證書時若需要確認「這位學員的教師是誰」（例如核對班級、或有疑問需要聯繫教師確認），必須跳出證書製作頁另外查找，操作不連貫。`cr-spec-260804-001` 剛建立了可重用的後台「會員標籤」元件（`MemberTag`，含檢視/傳訊息入口），此頁正是其「未來套用」清單中提出人設想的下一個使用場景。

## What Changes

- **新增教師資訊列**：證書製作卡片 SHALL 新增一列顯示該張證書所屬結業班級的教師（即該學員結業所依據之 `InviteEnrollment.invite.createdBy`，與清單既有「同人同階層取最新結業日」去重邏輯一致——教師對應到最終被採計的那筆結業紀錄）。
- **教師資訊以會員標籤呈現**：教師資訊 SHALL 使用 `admin-member-tag`（`cr-spec-260804-001` 建立）呈現，管理者可直接於卡片上「檢視」教師詳情或「傳訊息」聯繫，不需跳出頁面查找。
- 學員自身既有的身分資訊顯示方式（真實姓名主標題、性別 icon、顯示名稱、單位、啟動編號等）SHALL 維持不變，本次僅新增教師這一列，不取代既有學員資訊區塊。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `admin-certificate-production`：新增「證書卡片顯示教師資訊」需求

## Impact

- **Data Layer**（`lib/data/certificate.ts`）：`getCertificateProductionList` 的 `InviteEnrollment` 查詢的 `invite` select 擴充 `createdBy`（同 `admin-member-tag` 所需完整欄位）；`CertificateListItem` 新增 `teacher: MemberTagInfo`（`InviteEnrollment.invite` 與 `CourseInvite.createdBy` 皆為必填關聯，故此欄位不可為 `null`，與教材申請的 `instructor: MemberTagInfo | null` 不同）。
- **型別歸屬調整**：`MemberTagInfo` 型別目前定義於 `lib/data/course-order.ts`（`cr-spec-260804-001` 遺留的暫時放置位置），本次因第二個資料層（`lib/data/certificate.ts`）也需要，改遷移至元件本身所在的 `components/admin/member-tag.tsx` 匯出，兩個資料層皆改為從該處 import（純搬移，型別內容不變）。
- **UI**：`app/[locale]/(admin)/admin/certificates/page.tsx` 卡片新增教師資訊區塊（`<MemberTag {...it.teacher} />`）。
- **不修改**：既有學員身分資訊欄位、篩選/搜尋/分頁邏輯、標記完成/還原/備註等既有互動。

## Non-Goals

- 不變更證書清單既有的「每人每階層一張」去重規則，教師資訊完全依附於既有去重後的結業紀錄，不引入新的去重維度。
- 不處理教師帳號被刪除等邊界情況（`CourseInvite.createdBy` 為必填關聯，資料庫層級已保證存在）。
