## Context

後端完全實作，只需改寫前端 UI。兩個頁面目前是 `'use client'` 的整頁元件，直接改寫即可，無需抽 Server Component。

## Goals / Non-Goals

**Goals:**
- `/forgot-password`、`/reset-password` 改用 shadcn/ui，版面與登入/註冊頁一致
- 登入表單密碼欄旁加入「忘記密碼？」連結

**Non-Goals:**
- 不改動任何 Server Action 或 Prisma schema
- 不改動 Email 模板

## Decisions

**D1：版型複用登入/註冊頁兩欄結構**

`forgot-password/page.tsx` 和 `reset-password/page.tsx` 改為與 `login/page.tsx` 相同的結構：
- 桌面：左側 `bg-zinc-900` 品牌區 + 右側表單
- 手機：全版表單，頂部顯示 Logo + 右側導向連結（返回登入）

`/forgot-password` 頁左側引言：「忘記密碼？輸入您的 Email，我們將發送重設連結。」
`/reset-password` 頁左側引言：「設定您的新密碼，完成後即可重新登入。」

**D2：`forgot-password` 成功狀態維持頁面切換（不改 Dialog）**

目前成功後切換為 `submitted` 狀態顯示提示文字，此行為合理，維持不變，改用 shadcn/ui 元件呈現即可。

**D3：`reset-password` 的 `ResetPasswordForm` 保持 Suspense 包覆**

`useSearchParams()` 需要 Suspense，現有設計正確，維持不動。

**D4：登入頁「忘記密碼？」連結位置**

在 `user-auth-form.tsx` 密碼輸入欄的 label 列，右側加入 `<Link href="/forgot-password">` 小字連結，使用 `flex justify-between` 排版。

## Risks / Trade-offs

- 低風險，全部為純 UI 改寫，後端邏輯不動
