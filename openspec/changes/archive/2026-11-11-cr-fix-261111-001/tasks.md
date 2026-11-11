## 1. 修正對話框可捲動性

- [x] 1.1 `components/admin/invite-student-cells.tsx` 第 199 行：`DialogContent` 的 `className` 由 `"sm:max-w-md"` 改為 `"sm:max-w-md max-h-[90dvh] overflow-y-auto"`，比照 `components/dashboard/learning-intent-dialog.tsx` 既有寫法。

## 2. 性別／所屬教會並排

- [x] 2.1 將「性別」`select` 區塊與「所屬教會」`select` 區塊包進 `grid grid-cols-2 gap-2` 容器，各自保留原有 `Label` + `select`。
- [x] 2.2 「所屬教會」選擇「其他」時彈出的自由輸入 `Input` 移到並排 grid 容器外、獨立一行顯示。

## 3. 代填學員姓名欄位合併

- [x] 3.1 新增 i18n key `course.inviteStudent.proxyRealNameCombinedLabel`（`messages/zh-TW.json` = "真實姓名(教材姓名)"，`messages/en.json` 補對應英文）。
- [x] 3.2 `mode === 'proxy'` 時，真實姓名輸入框的 `Label` 改用新 key `proxyRealNameCombinedLabel`（`mode === 'existing'` 不受影響，但此欄位僅出現在 proxy 分支內，無需額外條件判斷）。
- [x] 3.3 教材所屬姓名欄位（`te('bookNameLabel')`，第 349–361 行區塊）加上 `mode === 'existing'` 條件，僅於既有會員路徑顯示；`mode === 'proxy'` 不渲染此欄位。
- [x] 3.4 `handleSubmit` 的 `addProxyStudentToInvite` 呼叫中，`materialBookName` 改傳 `materialChoice === 'none' ? undefined : proxyRealName`（`mode === 'existing'` 分支的 `addStudentToInvite` 呼叫維持原樣，仍用 `materialBookName` 狀態）。

## 4. 提示文字改為獨立彈跳視窗，連結移至底部按鈕列

- [x] 4.1 新增 i18n key `course.inviteStudent.proxyHintToggleShow`（繁："重要說明"），`messages/zh-TW.json` 與 `messages/en.json` 皆補上。
- [x] 4.2 新增 `proxyHintOpen` state（預設 `false`），`resetForm()` 一併重置為 `false`。
- [x] 4.3 移除原本位於「真實姓名(教材姓名)」欄位上方的提示文字／切換按鈕；改在底部按鈕列（取消／送出按鈕所在列）新增「重要說明」文字連結，僅於 `mode === 'proxy'` 顯示，置於列的左側，按鈕列改用 `justify-between`（`mode === 'existing'` 維持 `justify-end`）。
- [x] 4.4 新增獨立的 `Dialog`（`proxyHintOpen` 控制開關），內容顯示 `t('proxyHint')` 全文，取代原本的行內收合段落。

## 4a. 對話框頂部說明文字精簡

- [x] 4a.1 `messages/zh-TW.json` / `messages/en.json` 的 `course.inviteStudent.addDialogDesc` 移除「（搜尋或自社群好友清單點選）」補充說明，保留核心指引。

## 4b. 教材版本改為下拉選單

- [x] 4b.1 將「教材版本」的 `MATERIAL_OPTIONS.map` 卡片按鈕區塊（`grid grid-cols-2`）改為單一 `<select id="material-choice">`，`value={materialChoice}`、`onChange` 設回 `MaterialChoice`，樣式比照性別／所屬教會（`h-9 w-full rounded-md border px-3 py-1 text-sm bg-background`）。
- [x] 4b.2 選單下方保留目前選中選項的 `desc` 說明文字（`MATERIAL_OPTIONS.find(...).desc`，`text-xs text-muted-foreground`），不逐一列出全部選項說明。
- [x] 4b.3 `mode === 'existing'` 與 `mode === 'proxy'` 皆沿用同一個下拉選單（原本就是共用區塊），不拆分條件。

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 5.2 瀏覽器模擬小視窗高度（或實機 MacBook Air 13.3" 2560x1600）開啟「建立代填學員」對話框，確認可向下捲動到最下方並成功點擊送出按鈕完成建立。（使用者實機測試確認無誤）
- [x] 5.3 一般桌機（可視高度足夠）開啟同一對話框，確認版面與互動行為與修改前一致（無多餘空白捲動區域、無跳動）。（使用者實機測試確認無誤）
- [x] 5.4 「建立代填學員」路徑：確認性別／所屬教會並排顯示；確認僅看到一個「真實姓名(教材姓名)」欄位、無獨立教材姓名欄位；填寫後送出，確認建立成功且教材所屬姓名與真實姓名一致。（使用者實機測試確認無誤）
- [x] 5.5 「選擇既有會員」路徑：確認教材所屬姓名欄位仍獨立顯示，可填寫與會員真實姓名不同的值並正常送出。（使用者實機測試確認無誤）
- [x] 5.6 「建立代填學員」路徑：確認底部「重要說明」連結點擊後開啟彈跳視窗並顯示完整提示文字，關閉後不影響原本表單內容。（使用者實機測試確認無誤）
- [x] 5.7 「教材版本」改為下拉選單後，兩種模式（既有會員／代填學員）皆能正確切換選項、下方說明文字隨選取項目更新，選擇非「已有教材」時仍能正確送出 `materialChoice` 與教材姓名。（使用者實機測試確認無誤）

## 6. 版本號

- [x] 6.1 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期。
