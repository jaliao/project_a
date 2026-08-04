## 1. 抽出共用元件/工具

- [x] 1.1 新增 `components/shared/gender-icon.tsx`：匯出 `Gender` 型別（`'male' | 'female' | 'unspecified'`）與 `GenderIcon` 元件，內容移植自 `certificates/page.tsx` 既有的本地實作（藍色♂／粉色♀／淡色中性 icon，樣式不變）
- [x] 1.2 `certificates/page.tsx` 移除本地 `GenderIcon` 定義與 `IconGenderAgender`/`IconGenderFemale`/`IconGenderMale` import，改為 `import { GenderIcon } from '@/components/shared/gender-icon'`（`Gender` 型別本頁未直接使用，故僅匯入元件本身）
- [x] 1.3 `lib/utils/member-display.ts` 新增 `withRealName(displayName: string, realName: string | null): string`（真實姓名缺漏或與顯示名稱相同時僅回傳 `displayName`，否則回傳 `${displayName}（${realName}）`）

## 2. `MemberTagInfo` 型別擴充（components/admin/member-tag.tsx）

- [x] 2.1 `MemberTagInfo` 新增 `realName: string | null`、`gender: Gender`、`churchLabel: string | null`

## 3. Data Layer 調整

- [x] 3.1 `lib/data/course-order.ts`：`createdBy` select 新增 `gender: true`、`church: { select: { name: true } }`、`churchOther: true`
- [x] 3.2 `lib/data/course-order.ts`：`instructor` 組裝補上 `realName: invite.createdBy.realName ?? null`、`gender: invite.createdBy.gender`、`churchLabel: invite.createdBy.church?.name ?? invite.createdBy.churchOther ?? null`
- [x] 3.3 `lib/data/certificate.ts`：`member` 組裝補上 `realName: c.user.realName ?? null`、`gender: c.gender`、`churchLabel: c.churchLabel`（皆為既有變數，不需新查詢）
- [x] 3.4 `lib/data/certificate.ts`：移除 `CertificateGender` 型別定義，改為 `import type { Gender } from '@/components/shared/gender-icon'` 並將既有使用處（`CertificateListItem.gender`、`Eligible.gender` 等）改用 `Gender`

## 4. 元件版面調整

- [x] 4.1 `components/admin/member-tag.tsx` 改為左右兩欄版面：左欄頭像（`size="lg"`），右欄依序為啟動編號、單位、顯示名稱（`withRealName`）＋性別 icon（同列）、身分標籤、操作按鈕；「顯示名稱（真實名稱）」該行用 `text-sm font-medium`，其餘欄位用 `text-xs text-muted-foreground`
- [x] 4.2 `components/admin/member-text-tag.tsx` 觸發文字改為 `withRealName(info.displayName, info.realName)`（移除 `info.spiritId` 前綴）

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 5.2 開發環境登入 admin 帳號，開啟 `/admin/materials`，展開含講師的申請，確認會員標籤兩欄版面正確（頭像、啟動編號、單位、顯示名稱(真實名稱)+性別、身分標籤、操作按鈕）—— Playwright 結構化驗證：memberTagCard 內容含 spiritId/單位/顯示名稱/身分標籤，svg icon 數量 3（性別＋檢視＋訊息）
- [x] 5.3 開啟 `/admin/certificates`，確認「學員」列文字改為「顯示名稱（真實名稱）」格式；點擊展開的會員標籤同樣為兩欄版面且內容正確—— 觸發文字與 Popover 內 MemberTag 結構皆驗證正確（含單位教會名稱）
- [x] 5.4 找一位真實姓名未填的會員，確認文字元件與會員標籤皆僅顯示顯示名稱、無空括號—— 暫時將既有種子會員 realName 設為 null 驗證後還原，確認頁面無「（）」空括號
- [x] 5.5 確認操作按鈕（檢視/訊息）功能不受版面調整影響，行為與先前一致—— 檢視連結指向 `/admin/members/{id}`，訊息按鈕點擊後正確開啟訊息 drawer
- [x] 5.6 確認證書製作頁既有的姓名主標題/性別 icon 顯示（`GenderIcon` 抽出後）視覺與行為不變（回歸測試）—— 主標題區塊仍正確渲染性別 icon
