# 後台機敏資料遮蔽 — 技術設計（cr-spec-260701-008）

## Context

後台學員相關頁面（`/admin/members` 清單、`/admin/members/[id]` 詳情、`/admin/members/inactive`）皆為 server component，直接以明文渲染 Email；詳情頁未顯示電話（`phone` 已由 `lib/data/members.ts` 詳情查詢 select，僅用於「首次補填」判定）。需求為：機敏欄位（電話、Email）預設以 `***` 遮蔽，點一下可檢視。

威脅模型是**旁窺／螢幕分享外洩**，非權限外資料存取——能進這些頁面的人本來就具 `canAccessAdmin` 權限，有權查看明文。

## Goals / Non-Goals

**Goals:**
- 通用遮蔽元件，學員三頁的 Email／電話預設遮蔽、點擊切換檢視
- 詳情頁基本資料新增「電話」欄位（遮蔽顯示）
- 不影響既有搜尋（Email 比對）與其他欄位呈現

**Non-Goals:**
- 不做伺服器端「點擊才回傳明文」的授權 API 與稽核紀錄（見 Decisions）
- 不處理教材訂單表等其他後台頁面的收件人資料（後續變更再擴充）
- 不做全域「一鍵顯示全部」開關

## Decisions

### D1：顯示層遮蔽（client component 切換），非伺服器端揭露 API
- **作法**：新增 `components/admin/masked-value.tsx`（`"use client"`），props 收 `value: string | null | undefined`；內部 `useState` 控制 revealed。預設渲染固定字串 `***`（不反映實際長度，避免洩漏長度資訊），點擊切換明文，再點擊恢復遮蔽。
- **理由**：管理者本就有權檢視，目的僅是避免旁窺；明文隨頁面 payload 送達瀏覽器可接受。伺服器端揭露需另建 API、狀態管理與權限判定，與威脅模型不成比例。
- **替代方案**：server action 按需揭露＋稽核 log——防護對象是「不該看的人」，與本需求不符，放棄。

### D2：空值由元件統一處理
- `value` 為空（null/undefined/空字串）時直接顯示 `—`（不可點、不顯示 `***`），與各頁既有空值呈現一致，呼叫端不需再判空。

### D3：互動與可近性
- 以 `<button type="button">` 包裹（非 span onClick），鍵盤可操作；`aria-label` 依狀態切換（「顯示」／「隱藏」+ 欄位名，props 收 `label` 供組字）。
- 附眼睛圖示（Tabler `IconEye`/`IconEyeOff`）提示可點擊；表格內逐筆獨立切換，互不影響。

### D4：文案維持繁體、不進 i18n
- 後台字串本階段維持繁體（CLAUDE.md 第 12 點漸進遷移原則），`***`、`—` 與 aria 文案直接寫在元件內，不新增 messages key。

### D5：詳情頁新增「電話」欄
- `lib/data/members.ts` 詳情查詢已 select `phone`（`lib/data/members.ts:102`），僅需在詳情頁基本資料 `<dl>` 加一欄，值以 `<MaskedValue>` 呈現。清單頁與 inactive 頁的 Email 欄改用 `<MaskedValue>`（server component 中嵌 client 元件，符合既有 server-fetch → client-interactive 模式）。

## Risks / Trade-offs

- [明文仍在 HTML/payload 中，開發者工具可直接看] → 符合威脅模型（旁窺防護），非資安邊界；proposal 已載明為顯示層行為。
- [表格每列一個 client 元件，會員數大時 hydration 成本上升] → 元件極輕（一個 state、一個 button）；清單已有分頁機制，單頁筆數有限。
- [遮蔽後管理者無法直接複製 Email] → 點擊檢視後即為一般文字可複製；操作手冊補充說明。

## Open Questions

（無——範圍小且決策已於 proposal 階段確認。）
