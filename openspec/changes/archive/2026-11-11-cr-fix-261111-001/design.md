## Context

「建立代填學員」對話框（`components/admin/invite-student-cells.tsx`）使用共用的 `DialogContent`（`components/ui/dialog.tsx`），該 base 元件本身不限制 `max-height` 也不設 `overflow-y`，完全依賴內容自然高度置中顯示。當視窗可視高度較小（例如 MacBook Air 13.3" 的瀏覽器可視區域）、且對話框內容本身較長（路徑切換、表單欄位、教材版本選項等）時，內容會超出可視範圍且無法捲動，導致下方欄位與送出按鈕都無法操作。

專案內已有多個對話框遇過同樣情境並採用相同解法：`learning-intent-dialog.tsx`（`max-h-[90dvh] overflow-y-auto`）、`add-friend-dialog.tsx`（同樣寫法）、`material-order-dialog.tsx`（`max-h-[85vh] overflow-y-auto`）。

## Goals / Non-Goals

**Goals:**
- 「建立代填學員」對話框在可視高度不足時，可整體向下捲動至看到所有欄位與送出按鈕。
- 縮短「建立代填學員」表單總高度（性別/教會並排、姓名欄位合併、教材版本改下拉選單），同時改善填寫體驗（提示文字移出表單本體、改以彈跳視窗顯示，預設不佔版面）。

**Non-Goals:**
- 不調整 base `DialogContent`（`components/ui/dialog.tsx`）元件本身，避免影響其他未回報問題的對話框的既有版面行為。
- 不調整「選擇既有會員」（`mode === 'existing'`）路徑的欄位配置與送出邏輯，姓名欄位合併僅限「建立代填學員」（`mode === 'proxy'`）路徑。
- 不調整代填學員資料範圍限制（真實姓名／性別／所屬教會／選填 email 仍是僅有的收集欄位，`proxy-member-enrollment` 既有 Requirement 不變）。
- 不處理本對話框以外、其他尚未回報捲動問題的對話框（如有類似狀況應另開 CR 逐一確認後處理）。

## Decisions

- **在 `invite-student-cells.tsx` 的 `DialogContent` className 加上 `max-h-[90dvh] overflow-y-auto`，比照 `learning-intent-dialog.tsx` 既有寫法。**
  理由：與既有同類對話框使用同一套 Tailwind 樣式慣例（`90dvh` 而非 `90vh`，可正確處理行動裝置網址列造成的可視高度變化），維持專案內對話框樣式一致性，不需要新增共用元件或修改 base `DialogContent`。
- **性別與所屬教會改用 `grid grid-cols-2 gap-2` 並排，「其他教會」自由輸入欄位維持獨立一行置於並排列下方。**
  理由：兩個欄位都是短下拉選單，並排不影響可讀性，且是本次表單縮高的直接手段之一；「其他」輸入框內容長度不定，獨立一行較穩定，不勉強塞進同一格。
- **僅在 `mode === 'proxy'` 時合併「真實姓名」與「教材所屬姓名」為單一欄位，送出時以 `proxyRealName` 同時作為兩個欄位的值；`mode === 'existing'` 不受影響。**
  理由：代填學員是管理者/老師當場登記，真實姓名與教材上要印的姓名絕大多數就是同一個人、同一個寫法，分開填是多餘步驟；但「選擇既有會員」情境下，會員本身的真實姓名已是帳號既有資料、未必等於教材所屬姓名（例如家長代訂、暱稱印製等情境），不應一併合併，避免誤改既有會員的教材姓名語意。驗證邏輯維持在 Server Action 端（`materialBookName` 必填規則不變），前端僅改變代入來源，不觸碰 Zod schema。
- **提示文字改為獨立彈跳視窗（`Dialog`）顯示，連結移至底部按鈕列，而非表單上方的行內展開。**
  理由：使用者實測後認為放在表單最上方的行內展開佔用版面、與「真實姓名」欄位距離太近容易誤觸；改放在底部與取消／送出按鈕同一列，操作者填完表單準備送出前仍可隨時查看，且不佔用表單本體高度。彈跳視窗直接重用本檔案已匯入的 `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle` 元件（與外層新增代填學員的 Dialog 採相同手動 `open`/`onOpenChange` 控制模式），不需引入新的共用元件；Radix Dialog 原生支援巢狀獨立 Dialog，與本檔案既有的 `StudentPicker`（同樣以手動開關控制、巢狀於外層 Dialog JSX 內）用法一致。
- **對話框頂部說明文字（`addDialogDesc`）移除「（搜尋或自社群好友清單點選）」補充說明。**
  理由：純文案精簡，該補充說明在 `StudentPicker` 元件本身的操作介面已清楚呈現搜尋與好友清單兩種選取方式，對話框頂部不需重複說明，縮短後也減少表單整體高度。
- **「教材版本」從 4 個卡片按鈕改為單一 `<select>` 下拉選單，樣式比照性別／所屬教會；選中項目的說明文字移到選單下方單行顯示，不再逐一列出每個選項各自的 desc。**
  理由：卡片按鈕版面（`grid grid-cols-2`，每格含 label 與 desc 兩行文字）是整個表單中最高的區塊之一，改成單一下拉選單可大幅縮短表單高度，與本次其他縮高調整方向一致；僅顯示當前選中項目的說明文字即足以提示用途，不需要同時展示全部 4 個選項的說明。此欄位是 `mode === 'existing'` 與 `mode === 'proxy'` 共用的區塊，兩種模式一併改為下拉選單，不拆分特殊處理。

## Risks / Trade-offs

- 若未來其他對話框在小螢幕下也出現同樣問題，仍需逐一個案加上相同 className，而非一次性在 base 元件解決。此為刻意的範圍切分：避免本次 bug fix 擴大影響到其他未回報問題的對話框版面。
- 姓名欄位合併後，若代填學員的教材確實需要印製與真實姓名不同的名字（少數情境），操作者需先用真實姓名建立學員，之後再透過既有的教材訂單編輯流程個別調整教材所屬姓名；本次不在建立當下提供「姓名不同」的例外輸入途徑，屬刻意簡化。
- 提示文字改為彈跳視窗後不再隨表單一起顯示，可能降低部分操作者注意到「未填 email 需事後合併帳號」規則的機率；以「重要說明」這個明確文案、且固定置於送出按鈕旁（操作者送出前視線必經之處）降低此風險。

## Migration Plan

純前端樣式與表單欄位調整，無資料庫變更、無需 migration：
1. 調整 `invite-student-cells.tsx` 第 199 行 `DialogContent` 的 `className`。
2. 性別／教會改為並排 grid 版面。
3. `mode === 'proxy'` 下移除獨立教材所屬姓名欄位、真實姓名欄位標籤與送出值調整。
4. 新增 `proxyHintOpen` 狀態與底部「重要說明」連結＋獨立彈跳 `Dialog`，取代原本固定顯示在表單上方的提示文字段落。
5. 縮短 `addDialogDesc` 文案。
6. 「教材版本」改為下拉選單，移除卡片按鈕版面。
7. 新增對應 i18n key（`messages/zh-TW.json` / `messages/en.json`）。
8. 回退：還原 `invite-student-cells.tsx` 單一檔案與新增/調整的 i18n key 即可，無需資料回填。
