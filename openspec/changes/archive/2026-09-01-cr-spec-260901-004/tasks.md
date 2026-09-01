## 1. `components/conversation/conversation-thread.tsx`：彈性填滿

- [x] 1.1 最外層 `<div className="flex h-[60vh] min-h-[24rem] flex-col gap-4">` → `<div className="flex min-h-0 flex-1 flex-col gap-4">`（移除固定 `60vh`／`24rem`，高度交給父容器）
- [x] 1.2 `MessageScroller` 的 `className="flex-1 rounded-lg border"` → `className="flex-1 min-h-0 sm:rounded-lg sm:border"`（手機無框、可壓縮；`sm:` 以上恢復圓角外框）
- [x] 1.3 輸入列（`flex gap-2` 內 `Textarea` ＋「送出」`Button`）維持不變——確認它是 flex 的固定高子項，未加 `flex-1`／未被 `overflow` 裁切（已確認：row 為固定高 flex 子項，Textarea `rows={2}`，未被 overflow 裁切）
- [x] 1.4 檔首標準註解：更新 `2026-08-03 (Updated: 2026-09-01)`，補一行說明「行動裝置改為彈性高、手機不套外框」

## 2. `components/conversation/messages-page.tsx`：面板動態高 ＋ 手機去外框 ＋ 返回鍵進標題列

- [x] 2.1 訊息頁籤面板：`<div className="flex h-[calc(100vh-16rem)] min-h-[28rem] overflow-hidden rounded-lg border">` → `<div className="flex h-[calc(100dvh-13rem)] min-h-[24rem] overflow-hidden sm:h-[calc(100vh-16rem)] sm:min-h-[28rem] sm:rounded-lg sm:border">`。**偏離 spec 文字**：未加 `flex-col`／`sm:flex-row`——維持 row-flex 即可達成「手機單欄（靠 `mobileShowThread` 切 hidden）＋ 桌面雙欄」，且 row-flex 的 align-stretch 讓可見子欄自動撐滿面板高度；改 `flex-col` 反而會讓左側頻道列表（`shrink-0`、無 `flex-1`）在手機失去高度撐滿而需額外改動。
- [x] 2.2 左側頻道列表容器：`border-r` → `sm:border-r`（手機無右框；列與列之間的 `border-b` 分隔保留）
- [x] 2.3 右側窗格 `<div className="flex w-full flex-1 min-w-0 flex-col p-4 sm:flex …">` → 補 `min-h-0`（形成 `min-h-0` 鏈）
- [x] 2.4 **移除**右側窗格頂端的獨立返回列：
  ```
  <div className="mb-2 flex items-center gap-2 sm:hidden">
    <Button variant="ghost" size="icon" onClick={() => setMobileShowThread(false)}>
      <IconArrowLeft className="h-4 w-4" />
    </Button>
  </div>
  ```
- [x] 2.5 `selected` 態——對話資訊框：
  - 容器 class `space-y-2 rounded-lg border p-3` → `space-y-2 border-b pb-3 sm:rounded-lg sm:border sm:p-3`（手機：僅底部分隔線、無圓角、無左右上框、無水平 padding；`sm:` 恢復完整卡片框）
  - 標題列（`flex items-center gap-2`）末端（釘選鈕之後、`editingTitle` 時勾選鈕之後）新增 `sm:hidden` 返回鈕：
    ```
    <Button variant="ghost" size="icon" className="size-8 shrink-0 sm:hidden"
            aria-label={tCommon('back')} title={tCommon('back')}
            onClick={() => setMobileShowThread(false)}>
      <IconArrowLeft className="h-4 w-4" />
    </Button>
    ```
  - 於元件內加 `const tCommon = useTranslations('common')`（已加）
- [x] 2.6 `isPicking` 態：於 `<div className="space-y-3">` 最上方插入
  ```
  <div className="mb-1 flex items-center justify-between sm:hidden">
    <span className="text-sm text-muted-foreground">{t('pickerHint')}</span>
    <Button variant="ghost" size="icon" className="size-8 shrink-0"
            aria-label={tCommon('back')} title={tCommon('back')}
            onClick={() => setMobileShowThread(false)}>
      <IconArrowLeft className="h-4 w-4" />
    </Button>
  </div>
  ```
  （原本的 `<p className="text-sm text-muted-foreground">{t('pickerHint')}</p>` 可改為 `hidden sm:block` 避免重複，或保留桌面用）
- [x] 2.7 空狀態（`selected` 為 null）：把提示 `<p>` 包一層 `space-y-3` div，於其上加 `sm:hidden` 的 `justify-between` 返回列（結構同 2.6），原 `<p>` 改 `hidden sm:block` 避免手機重複
- [x] 2.8 `<ConversationThread>` 呼叫處：確認外層 `flex min-h-0 flex-1 flex-col gap-3` 容器保留 `min-h-0`（現有），使 1.1 的彈性高能生效
- [x] 2.9 檔首標準註解：`Updated: 2026-09-01`，補一行「訊息頁籤行動裝置版面優化（`100dvh` 彈性高、手機無外框、返回鍵移入標題列右上角）——cr-spec-260901-004」

## 3. 手動驗證（`npm run dev`，行動裝置模擬 375×667 / 390×844）

- [ ] 3.1 「訊息」頁籤 → 開啟一則對話：對話串 ＋ 輸入框皆在面板內可見，輸入框**未被 Footer 遮蔽 / 未被裁切**
- [ ] 3.2 `Textarea` 聚焦叫出軟體鍵盤（或縮小視窗高）：對話串區壓縮可捲，輸入框仍完整可見
- [ ] 3.3 進入對話自動捲到最新訊息；送出訊息後自動貼齊底部；上捲後出現「回到底部」鈕、點擊可捲回
- [ ] 3.4 手機下面板、對話資訊區、對話串**無巢狀外框**（僅細分隔線）；頻道列表列間分隔線仍在
- [ ] 3.5 返回鍵位於**對話標題同一列、右上角**；點擊回頻道列表；`isPicking` 與空狀態的返回鍵亦在右上角
- [ ] 3.6 `≥ sm`（桌面）：雙欄 ＋ 圓角外框樣式與改動前一致；釘選 / 標題編輯 / 邀請 / `?with=` / `?tab=` 行為不變
- [x] 3.7 `npm run lint` ＋ `npm run build` 通過（eslint 0、`tsc --noEmit` 0、`npm run build` ✓ exit 0；`/[locale]/messages` 仍為 ƒ 動態）

## 4. 文件與版本號

- [x] 4.1 `doc/學員手冊.md`〈十五、社群〉「訊息頁籤」段：「左上角」→「**右上角**（與對話標題同一列）」＋補「對話串採 Message Scroller、輸入框不會被頁尾遮蔽、精簡外框」；檔首 v0.1.192（2026-09-01）＋本版更新註記
- [x] 4.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：無「訊息頁籤操作細節」章節，內容未改；檔首版本同步 v0.1.192（2026-09-01）＋註記「僅影響學員端呈現」
- [x] 4.3 `config/version.json`：0.1.191 → 0.1.192；`updatedAt` 已為 2026-09-01（當日）
- [x] 4.4 `ai-context/03-architecture.md`：`messages/` 條目下新增行動版面說明（`h-[calc(100dvh-13rem)]`＋`min-h-0` 鏈、message-scroller 自動捲底、手機 `sm:border`、返回鍵在標題列右上角）
- [x] 4.5 `ai-context/07-current-tasks.md`「已完成」清單最前面追加 `cr-spec-260901-004` 完整記錄
- [x] 4.6 `README-AI.md`：版本行 0.1.191 → 0.1.192
- [x] 4.7 本 CR **未動** `messages/*.json`（返回鍵沿用既有 `common.back`）；無需 `gen:zh-cn`
