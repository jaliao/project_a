## Why

使用者回報「建立代填學員」對話框（`components/admin/invite-student-cells.tsx` 第 199 行，`<DialogContent className="sm:max-w-md">`）在螢幕可視高度較小的裝置（實測：MacBook Air 13.3" 解析度 2560x1600）下，無法向下捲動。查看 base `DialogContent`（`components/ui/dialog.tsx` 第 50–71 行）本身未限制 `max-height` 也未設定 `overflow-y`，僅以絕對定位置中、靠內容自然撐高；當對話框內容（含路徑切換、表單欄位、教材版本選項等）高度超出視窗可視高度時，超出部分完全無法被捲動到，導致下方欄位（教材所屬姓名、已結業勾選）與送出按鈕都看不到也點不到，該流程在小螢幕上完全無法使用。

專案內其他對話框已有相同情境的既定修法：`components/dashboard/learning-intent-dialog.tsx` 第 126 行與 `components/community/add-friend-dialog.tsx` 第 161 行皆在 `DialogContent` 的 `className` 加上 `max-h-[90dvh] overflow-y-auto`，讓對話框在小螢幕下可整體捲動。本次僅需比照同樣寫法套用到「建立代填學員」對話框。

同一次處理中，使用者也一併提出三項「建立代填學員」表單的版面精簡需求，一併納入本次修改範圍：

1. 「性別」與「所屬教會」目前各自獨佔一整列，實際欄位內容都很短（下拉選單），直排顯得冗長，希望並排放在同一行，縮短表單總高度（也有助於緩解小螢幕捲動問題）。
2. 「真實姓名」（`proxyRealName`）與「教材所屬姓名」（`materialBookName`，`te('bookNameLabel')`）在代填學員情境下絕大多數狀況是同一個人名，分開填寫是多餘步驟；希望合併為單一欄位，只保留「真實姓名」輸入框，欄位標籤改為「真實姓名(教材姓名)」，送出時以該值同時作為 `realName` 與 `materialBookName`。此合併僅限「建立代填學員」（`mode === 'proxy'`）路徑；「選擇既有會員」（`mode === 'existing'`）路徑的教材所屬姓名欄位維持獨立，不受影響（既有會員的真實姓名為既有帳號資料，與教材所屬姓名未必相同）。
3. 代填學員提示文字（`t('proxyHint')`：「此學員尚未註冊帳號...」）目前一開啟代填模式就直接顯示一整段，希望預設隱藏；且「重要說明」連結希望改放在底部與取消／送出按鈕同一列（而非表單上方），點擊後改用獨立的彈跳視窗（`Dialog`）顯示完整提示文字，而非行內展開。
4. 對話框頂部說明文字（`t('addDialogDesc')`）希望縮短，移除「（搜尋或自社群好友清單點選）」這段補充說明，保留核心指引即可。
5. 「教材版本」目前是 4 個卡片按鈕（`grid grid-cols-2`，各含 label＋desc），希望改成與性別／所屬教會一致的下拉選單，進一步縮短表單高度；此欄位為 `mode === 'existing'` 與 `mode === 'proxy'` 共用，兩種模式都改為下拉選單。

## What Changes

- `components/admin/invite-student-cells.tsx` 第 199 行 `DialogContent` 的 `className` 由 `"sm:max-w-md"` 改為 `"sm:max-w-md max-h-[90dvh] overflow-y-auto"`，比照既有 `learning-intent-dialog.tsx` / `add-friend-dialog.tsx` 的寫法，讓對話框在可視高度不足時可整體向下捲動，確保所有欄位與送出按鈕都能被捲動到並操作。
- 「性別」「所屬教會」改用 `grid grid-cols-2 gap-2` 並排顯示（各自保留原有 `Label` + `select`），「所屬教會」選擇「其他」時彈出的自由輸入欄位維持獨立一行、置於並排列下方。
- 僅於 `mode === 'proxy'`：移除獨立的「教材所屬姓名」欄位，「真實姓名」輸入框標籤改為「真實姓名(教材姓名)」，送出 `addProxyStudentToInvite` 時 `materialBookName` 改傳 `proxyRealName` 的值（`materialChoice !== 'none'` 時）。`mode === 'existing'` 路徑的「教材所屬姓名」欄位與送出邏輯不變。
- 新增 `proxyHintOpen` 狀態（預設 `false`，切換模式/重置表單時一併重置）；底部按鈕列（取消／送出按鈕所在列，僅 `mode === 'proxy'` 時）左側新增「重要說明」文字連結，按鈕列改用 `justify-between`（`mode === 'existing'` 維持 `justify-end`）；點擊後開啟獨立的 `Dialog` 顯示 `proxyHint` 全文，取代原本固定顯示在表單上方的段落。
- 新增 i18n key：`course.inviteStudent.proxyRealNameCombinedLabel`（繁："真實姓名(教材姓名)"）、`course.inviteStudent.proxyHintToggleShow`（繁："重要說明"），均同步補上 `messages/en.json` 英文翻譯；`messages/zh-CN.json` 依專案慣例以 `npm run gen:zh-cn` 自動產生，不手動修改。
- `course.inviteStudent.addDialogDesc` 文案精簡：移除「（搜尋或自社群好友清單點選）」補充說明，`messages/zh-TW.json` / `messages/en.json` 同步縮短。
- 「教材版本」選擇從 4 個卡片按鈕改為單一 `<select>` 下拉選單（比照性別／所屬教會的樣式 `h-9 w-full rounded-md border px-3 py-1 text-sm bg-background`），下方保留目前選中選項的 `desc` 說明文字（`text-xs text-muted-foreground`），不再逐一顯示 4 個選項各自的說明；不新增 i18n key，沿用既有 `tm()`/`te()` 文案。此欄位 `mode === 'existing'` 與 `mode === 'proxy'` 共用，皆改為下拉選單。
- 不更動對話框內部其餘欄位的驗證邏輯（Zod schema、Server Action `app/actions/invite-students.ts`）或既有的代填學員資料範圍限制（見 `proxy-member-enrollment` capability 既有 Requirement）；「教材所屬姓名」必填規則（`materialChoice !== 'none'` 時必填）不變，僅改由前端以 `proxyRealName` 代入該值。

## Capabilities

### Modified Capabilities

- `proxy-member-enrollment`：新增兩條 Requirement——「建立代填學員對話框可捲動」與「建立代填學員真實姓名與教材姓名合併」，明確記錄對話框捲動行為與（僅限代填路徑）姓名欄位合併規則，避免後續 CR 誤判此次已完成互動功能或誤解欄位範圍。

## Impact

- **修改** `components/admin/invite-student-cells.tsx`：第 199 行 `DialogContent` className；性別/教會並排版面；代填模式姓名欄位合併與送出邏輯；提示文字改為底部連結＋獨立彈跳視窗；頂部說明文字精簡；教材版本改為下拉選單。
- **修改** `messages/zh-TW.json`、`messages/en.json`：新增上述 i18n key，並縮短 `addDialogDesc` 文案。
- **不修改** `components/ui/dialog.tsx`（base 元件維持不限制 max-height，交由各用途對話框依需求自行加上，與專案既有其他對話框的作法一致）。
- **不修改** `app/actions/invite-students.ts` 或任何 Zod schema：`materialBookName` 必填規則不變，僅前端代入值的來源改變；`mode === 'existing'` 送出邏輯完全不變。
- **不需要**資料庫 schema 變更。
- **操作手冊**：已檢查 `doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md`，三份手冊均未描述此對話框的詳細版面與欄位配置，無需修改；僅於 apply 階段依慣例將 `config/version.json` patch +1。
