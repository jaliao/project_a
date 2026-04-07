## Context

`register-form.tsx` 是純 Client Component，Email 註冊成功後呼叫 `toast.success()`。變更範圍僅此一個檔案，無資料模型或 Server Action 異動。

## Goals / Non-Goals

**Goals:**
- Email 註冊成功後以 Dialog 取代 toast，提供「返回首頁」按鈕導向 `/`

**Non-Goals:**
- 不改變 Google OAuth 流程
- 不異動 `registerWithEmail` Server Action
- 不新增任何 API 或資料庫欄位

## Decisions

**D1：Dialog 狀態用 `useState` 管理**

在 `RegisterForm` 新增 `successOpen` state，`registerWithEmail` 成功後設為 `true` 開啟 Dialog。Dialog 內只有一個「返回首頁」按鈕，點擊後以 `useRouter().push('/')` 導向首頁。不需要 `onOpenChange` 關閉邏輯（成功後不讓使用者關掉 Dialog 再停留在註冊頁）。

**D2：使用現有 Radix Dialog（shadcn/ui）**

專案已有 `components/ui/dialog.tsx`，直接引用，不新增依賴。

## Risks / Trade-offs

- **RW1：使用者按瀏覽器上一頁** → 回到 `/register`，表單已重置，無負面影響
