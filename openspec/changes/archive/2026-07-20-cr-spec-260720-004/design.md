# Design: cr-spec-260720-004 已完成申請（教材）按鈕優化

## Context

cr-260720-003 三單元化後：完成狀態列（「教材申請已完成」＋重新開放）在單元②教材申請進度；「已完成申請」按鈕在單元③申請作業且無前置條件；注意事項為框框內段落。`CourseSessionOrder`（`orders` prop）已含 `receivedAt`，判定進行中訂單無需新查詢。

## Goals / Non-Goals

**Goals:**
- 有進行中訂單（任一 `receivedAt == null`）時「已完成申請」停用（灰色），停用原因寫入注意事項；server 同步驗證。
- 完成狀態（訊息＋「重新開放申請」）移至單元③申請作業。
- 注意事項改 `<li>` 清單、無外框。

**Non-Goals:**
- 不改開課門檻、申請對話框、訂單流程。
- 「申請教材」按鈕的停用邏輯不變（僅標記完成時停用）。

## Decisions

### D1：「進行中訂單」定義＝任一訂單 `receivedAt == null`

- 已收件訂單與已取消（已刪除）訂單不算；待批價／待付款／待確認收款／待寄送／已寄送未收件皆算進行中。
- UI：`const hasActiveOrders = orders.some((o) => o.receivedAt == null)`；「已完成申請」`disabled={hasActiveOrders || finalizePending}`。
- Server：`finalizeMaterialOrders` 查該課程訂單，存在 `receivedAt: null` 者回傳 `{ success: false, message: '尚有進行中的教材訂單…' }`（防繞過 UI／並發）。

### D2：完成狀態列移至申請作業單元（設計）

單元③申請作業的兩種狀態：

```
未完成：                          已完成：
申請注意事項                      申請注意事項
・「申請教材」：…                 ・「申請教材」：…
・「已完成申請」：…               ・「已完成申請」：…
・有進行中的教材訂單時…           ・有進行中的教材訂單時…
[申請教材] [已完成申請]           [申請教材(停用)]
                                  ┌────────────────────────────┐
                                  │ ✓ 教材申請已完成  [重新開放申請] │
                                  └────────────────────────────┘
                                  （申請教材已停用提示）
```

- 完成後：「已完成申請」按鈕隱藏，原位置下方顯示綠色狀態列（✓ 訊息＋「重新開放申請」）；「申請教材」維持停用＋`applyDisabledFinalized` 提示。
- 單元②教材申請進度不再顯示完成狀態列（只留統計與訂單清單）。

### D3：注意事項清單化

- 框框（`rounded-md border bg-muted/30`）移除，改「申請注意事項」小標＋`<ul className="list-disc pl-5 …"><li>…</li></ul>`。
- 條目：①申請教材說明 ②已完成申請說明 ③**新增**「有進行中的教材訂單（尚未收件）時無法按『已完成申請』，請先完成收件」（i18n key `noteFinalizeBlocked`）④（總需求 0 時）`noDemandHint`。

### D4：i18n 與訊息

- 新 key：`noteFinalizeBlocked`（注意事項條目）、`finalizeBlockedByOrders`（server 拒絕訊息用繁體字串，維持動作層 message 非 key 之慣例）。
- 既有 key 不動；手冊補充停用規則與狀態列位置。

## Risks / Trade-offs

- [老師誤以為按鈕壞掉] → 注意事項明列停用原因；訂單全收件後自動恢復可按。
- [與 -001/-003 同檔疊改未歸檔] → delta spec 以最終狀態撰寫，歸檔順序 001 → 003 → 004。

## Migration Plan

無 migration（UI＋action 驗證）。

## Open Questions

（無）
