## 1. 共用元件

- [x] 1.1 新增 `components/admin/member-home-link.tsx`：`MemberHomeLink({ spiritId, size?, variant? })`
  - spiritId 有值 → Button asChild 包 next/link，href 為 "/user/" + spiritId.toLowerCase()，target="_blank" rel="noopener noreferrer"，文字「會員首頁」
  - spiritId null/空 → `<Button disabled title="此會員尚無啟動編號">會員首頁</Button>`
  - 預設 variant="ghost" size="sm"；加標準繁中檔頭註解

## 2. 套用到三處使用點

- [x] 2.1 `app/[locale]/(admin)/admin/members/page.tsx`：import MemberHomeLink，於「操作」欄 flex 容器內「查看詳情」之後、`MemberResetButton` 之前插入 `<MemberHomeLink spiritId={member.spiritId} />`
- [x] 2.2 `app/[locale]/(admin)/admin/members/inactive/page.tsx`：import MemberHomeLink；「操作」欄由單一 Button 改為 `flex items-center justify-end gap-2` 容器，「查看詳情」之後插入 `<MemberHomeLink spiritId={m.spiritId} />`（`InactiveMember.spiritId: string | null`，多為 null → disabled）
- [x] 2.3 `app/[locale]/(admin)/admin/members/[id]/page.tsx`：import MemberHomeLink，於頁首 `flex items-center gap-4` 容器尾端（`SendMessageButton` 之後）插入 `<MemberHomeLink spiritId={member.spiritId} />`

## 3. 驗證

- [x] 3.1 `npm run lint`（0 error；新檔／改檔無新增 warning）
- [x] 3.2 `npm run build`（EXIT=0，`✓ Compiled successfully`；TypeScript 通過。static generation 階段的 `prisma:error` 為本機 dev DB 未啟動所致，與本變更無關）
- [~] 3.3 dev server 實測：本機 dev DB 容器未啟動、無法起 dev server（比照 `cr-spec-260828-006` 處理方式）。已於程式層確認：
  - 三處皆傳入既有查詢已 select 的 `spiritId`；`MemberHomeLink` 對 null 走 disabled 分支、對有值輸出 `/user/<toLowerCase>` 且 `target="_blank"`
  - `/user/[spiritId]` route 已存在且於 `(user)` group，管理者通過該 group 守衛即可瀏覽
  - 待使用者於自有終端起 dev server 後點擊實測（新分頁開啟、大小寫、disabled hover 提示）

## 4. 文件與版本（CLAUDE.md #7 #8 #9）

- [x] 4.1 `doc/管理者操作手冊.md` 第四章：清單功能新增「操作欄」條目（查看詳情＋會員首頁，新分頁、唯讀、無啟動編號停用）、會員詳情段補頁首「會員首頁」按鈕、未啟用會員清單段補述；檔首版本 v0.1.175 → **v0.1.178**、「本版更新」說明改為本次內容（日期 2026-08-28）
- [x] 4.2 `doc/老師手冊.md`、`doc/學員手冊.md`：純後台管理者功能、無異動 → 未改動、未 bump
- [x] 4.3 `README-AI.md` 版本 0.1.177 → 0.1.178；`ai-context/03-architecture.md` 路由樹（members／members/[id]／members/inactive 敘述補「會員首頁」）與元件清單（新增 `member-home-link.tsx`）；`ai-context/07-current-tasks.md`「已完成」最前面新增 `cr-spec-260828-008` 條目
- [x] 4.4 `config/version.json`：0.1.177 → **0.1.178**，`updatedAt` = 2026-08-28

## 5. OpenSpec 收尾

- [x] 5.1 `openspec validate cr-spec-260828-008 --strict` 通過
- [x] 5.2 apply 完成後同步進度回 ERP（由 /cr-apply 流程處理）
