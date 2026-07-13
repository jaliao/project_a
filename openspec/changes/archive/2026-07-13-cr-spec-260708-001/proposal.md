# Footer 版本資訊＋語言切換移入個人資料

## Why

`config/version.json` 是版本唯一來源，但側邊欄改為 Topbar 後版本顯示已消失——使用者與維運無從得知目前部署版本與更新時間。另外語言切換器掛在 Topbar 每頁常駐，屬低頻設定，應收納到個人資料頁。

## What Changes

- `config/version.json` 新增 **`updatedAt`** 欄位（系統更新日期，隨每次 `/opsx:apply` 版本 patch +1 同步更新）。
- 新增共用 **Footer** 元件：顯示版本號與系統更新日期（如 `v0.1.129 · 2026-07-08`），掛載於 `(user)` 與 `(admin)` 兩個 layout（登入後所有頁面可見；免登入頁不加）。
- **語言切換移位**：Topbar 移除 `LanguageSwitcher`；個人資料頁（`/user/[spiritId]/profile`）新增「語言設定」區塊放置切換器；**登入頁保留**（訪客登入前仍需切換語言）。
- CLAUDE.md 第 7 點「側邊欄底部會顯示對應版本」敘述同步改為 Footer。

## Capabilities

### New Capabilities

- `footer-version-info`: 登入後頁面 Footer 顯示版本號與系統更新日期，資料源為 `config/version.json`（`version`＋`updatedAt`），每次版本遞增時同步更新日期。

### Modified Capabilities

- `language-switcher`: 切換器出現位置由「Topbar（登入後）與免登入頁」改為「**個人資料頁（登入後）與免登入頁**」；切換行為（保留路徑、記偏好、三語言）不變。

## Impact

- **程式碼**：`config/version.json`（＋updatedAt）、新增 `components/layout/footer.tsx`、`app/[locale]/(user)/layout.tsx`、`app/[locale]/(admin)/layout.tsx`（掛 Footer）、`components/layout/topbar.tsx`（移除切換器）、`app/[locale]/(user)/user/[spiritId]/profile/page.tsx`（語言設定區塊）、i18n（區塊標題 key）。
- **文件**：三份手冊「語言切換」入口描述更新＋Footer 版本說明；CLAUDE.md 第 7 點；version.json patch +1；README-AI。
- **不影響**：i18n routing／cookie 機制、登入頁切換器、Topbar 其他按鈕。
