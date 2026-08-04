## Context

`MemberTag`（`components/admin/member-tag.tsx`）本身已是一張有邊框、內距的卡片（`inline-flex items-center gap-3 rounded-lg border bg-background px-3 py-2`）。shadcn 的 `PopoverContent` 預設也有自己的邊框、內距、陰影、背景（`w-72 rounded-md border bg-popover p-4 shadow-md`）。若直接把 `MemberTag` 塞進預設 `PopoverContent`，會變成「卡片外面又包一層卡片」的雙層邊框，視覺上不乾淨。

`cr-spec-260804-002` 為證書卡片新增的教師會員標籤是本次要撤除的對象；`admin-certificate-production` capability 尚未封存（`cr-spec-260804-002` 仍在 `spec_apply`），故本次以正規的 `REMOVED`／`ADDED` delta 處理，而非回頭竄改 002 的既有 spec 內容——保留「002 加、004 撤」的真實異動軌跡。

## Goals / Non-Goals

**Goals:**
- 新增輕量、按需展開的「會員文字元件」，作為 `MemberTag` 的元件家族變體。
- 證書製作頁改用更精簡的呈現方式（移除常駐教師卡片，學員列改為可展開的文字元件）。

**Non-Goals:**
- 不變更 `MemberTag` 本身的樣式或行為。
- 不變更教材申請頁既有的教師會員標籤呈現方式。

## Decisions

### `PopoverContent` 移除預設樣式，讓 `MemberTag` 自己的邊框當作彈出框邊框
```tsx
<PopoverContent className="w-auto border-none bg-transparent p-0 shadow-none">
  <MemberTag {...info} />
</PopoverContent>
```
避免雙層邊框；`MemberTag` 本身的陰影/邊框已足夠標示這是一個彈出的獨立區塊。

### 觸發文字樣式：底線文字按鈕，非連結
用 `<button type="button">` 而非 `<a>`（`PopoverTrigger asChild`），因為這是「展開彈出框」而非導覽，語意上是按鈕不是連結；樣式用 `underline underline-offset-2` 呈現「可點擊的文字」外觀，符合票單描述的底線要求。

### `CertificateListItem` 新增 `member: MemberTagInfo`（學員自身），移除 `teacher`
證書卡片列的「主體」原本就是學員本人，`member` 欄位承載的正是既有 `userId`／`spiritId`／`displayName` 已經算過的同一位學員，只是額外補上 `MemberTag` 所需的 `roles`／`avatarUrl`。命名上不用 `student`（雖然票單稱「學員」），因為 `MemberTagInfo`／`MemberTextTag` 是通用元件、不專屬學員語意，`member` 更貼合元件契約本身的中性命名（教材申請頁的對應欄位也命名為 `instructor`／未來若有其他頁面用同一元件包其他身分的人，`member` 這個命名可沿用而不失準確）。

### 移除 `cr-spec-260804-002` 的教師相關程式碼（非僅隱藏 UI）
`invite.createdBy` 的 select 擴充、`teacher: MemberTagInfo` 欄位、卡片上的教師區塊，三處全部移除（非保留查詢但不顯示）。理由：沒有消費端就不該保留查詢成本與死程式碼，且 `cr-spec-260804-002` 才剛完成、尚未封存，直接乾淨撤除比留著「以防萬一」更符合專案一貫的最小改動原則。

## Risks / Trade-offs

- [風險] `cr-spec-260804-002` 的 spec delta（`admin-certificate-production` 新增「證書卡片顯示教師資訊」）尚未封存進主規格；本次以 `REMOVED` 撤除同一份需求文字，兩者的封存順序必須是 002 先於 004，否則 `openspec archive` 在合併 004 的 `REMOVED` 時會找不到對應的既有需求標題而中止 → Mitigation：封存時依變更編號順序（002 → 004）處理，與本專案封存慣例一致（依 change 名稱排序）。
