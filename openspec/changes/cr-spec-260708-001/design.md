# Footer 版本資訊＋語言切換移入個人資料 — 技術設計

## Context

- `config/version.json` 僅 `{ "version": "x.y.z" }`，無日期；目前無任何 UI 顯示它（舊側邊欄顯示已隨 Topbar 改版消失）。
- `LanguageSwitcher`（client，`@/i18n/navigation` 保路徑切換＋`NEXT_LOCALE` cookie）掛在 `components/layout/topbar.tsx:76` 與登入頁。
- Topbar 由 `(user)/layout.tsx` 與 `(admin)/layout.tsx` 各自渲染。
- 個人資料頁 `/user/[spiritId]/profile`：profile-form＋變更密碼卡＋登出區塊，垂直卡片堆疊。

## Goals / Non-Goals

**Goals:**
- 登入後所有頁面 Footer 顯示版本與系統更新日期。
- 語言切換收納到個人資料頁；Topbar 移除；登入頁保留。

**Non-Goals:**
- 不改語言切換行為與 i18n 機制。
- 免登入頁不加 Footer（登入頁維持簡潔）。
- 不做「語言偏好存 DB」（維持 cookie 機制）。

## Decisions

1. **`version.json` 加 `updatedAt`（YYYY-MM-DD）**
   與 patch +1 同步手動維護（apply 慣例第 7 點擴充）；不用 build time（standalone image 重啟會變、且與版本語意脫鉤）。

2. **Footer 為 server 元件，直接 import version.json**
   `components/layout/footer.tsx`：`import version from '@/config/version.json'`，顯示 `v{version} · {updatedAt}`——純符號與數字、語言中立，**不需 i18n key**。樣式：置底、細字、muted、置中（`text-xs text-muted-foreground text-center py-4`）。分別掛在 `(user)` 與 `(admin)` layout 主內容之後。

3. **個人資料頁「語言設定」卡片**
   於變更密碼卡與登出區之間新增卡片：標題「語言設定」（i18n key，如 `profile.languageTitle`，比照該頁既有 key 慣例）＋既有 `LanguageSwitcher` 元件原樣重用。

4. **Topbar 移除切換器**
   刪 import 與 `<LanguageSwitcher />`；Topbar spec 無語言相關 requirement，不需 topbar delta；`language-switcher` spec MODIFIED 位置敘述。

5. **CLAUDE.md 第 7 點同步**
   「側邊欄底部會顯示對應版本」改為「Footer 顯示版本與更新日期，`updatedAt` 隨 patch +1 同步更新」。

## Risks / Trade-offs

- **[使用者找不到語言切換]** → 個人資料為設定類功能慣性位置；手冊同步更新入口說明。
- **[updatedAt 靠手動維護可能漏更]** → 已納入 apply 慣例（與版本 +1 同一動作）；漏更僅影響顯示非功能。

## Migration Plan

無 migration；部署即生效。回滾為還原程式碼。

## Open Questions

（無）
