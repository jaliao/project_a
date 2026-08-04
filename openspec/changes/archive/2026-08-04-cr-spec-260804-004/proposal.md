## Why

`cr-spec-260804-001` 建立的「會員標籤」（`MemberTag`）是常駐顯示的完整卡片，套用到 `cr-spec-260804-002` 的證書製作頁後，每張證書卡片都固定佔用一塊空間顯示教師資訊，但多數證書其實共用同一位教師（同班學員），造成畫面重複、佔用大量版面卻資訊密度低。需要一種更輕量、按需展開的呈現方式：預設只顯示一行可辨識的文字，需要時才點開查看完整資訊。

## What Changes

- **新增「會員文字元件」**（`MemberTextTag`，後台專用，`admin-member-tag` 新增需求）：以底線文字呈現「啟動編號＋顯示名稱」（格式如 `PA26001 羅詠韶`），點擊後以 Popover 彈出完整「會員標籤」（`MemberTag`，含檢視/傳訊息入口）。與 `MemberTag` 共用同一份 `MemberTagInfo` 資料契約，是同一元件家族的輕量變體。
- **證書製作頁移除教師欄位**：`cr-spec-260804-002` 新增的教師會員標籤區塊 SHALL 自證書卡片移除（提出人確認不需要）。
- **證書製作頁啟動編號改用會員文字元件**：卡片原本純文字顯示的「啟動編號」列，SHALL 改為「學員」列，以會員文字元件呈現該學員的啟動編號＋顯示名稱，點擊可展開完整會員標籤（含檢視/傳訊息）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `admin-member-tag`：新增「會員文字元件」需求（底線文字＋Popover 展開完整會員標籤）
- `admin-certificate-production`：移除「證書卡片顯示教師資訊」需求（`cr-spec-260804-002` 新增，本次撤除）；新增「證書卡片學員列使用會員文字元件」需求

## Impact

- **UI**：新增 `components/admin/member-text-tag.tsx`（`Popover`/`PopoverTrigger`/`PopoverContent` 包覆既有 `MemberTag`）。
- **Data Layer**（`lib/data/certificate.ts`）：移除 `cr-spec-260804-002` 新增的 `invite.createdBy` select 與 `CertificateListItem.teacher` 欄位；`user` select 新增 `roles`／`avatarKey`／`image`，`CertificateListItem` 新增 `member: MemberTagInfo`（呈現該學員自身，供會員文字元件使用）。
- **UI**：`app/[locale]/(admin)/admin/certificates/page.tsx` 移除教師會員標籤區塊；「啟動編號」列改為「學員」列並改用 `<MemberTextTag {...it.member} />`。
- **不修改**：`MemberTag` 元件本身、教材申請頁（`/admin/materials`）既有的教師會員標籤呈現方式（該頁沿用 `cr-spec-260804-001` 的完整卡片版本，本次新元件不影響既有用法）。

## Non-Goals

- 不移除或修改教材申請頁（`/admin/materials`）既有的教師會員標籤（完整卡片版本），該頁的資訊密度與使用情境與證書頁不同，維持現狀。
- 不處理 `MemberTextTag` 在其他頁面的套用，本次僅套用於證書製作頁的學員列。
