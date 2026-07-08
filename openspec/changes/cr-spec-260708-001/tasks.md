# Tasks — Footer 版本資訊＋語言切換移入個人資料（cr-spec-260708-001）

## 1. Footer 版本資訊

- [x] 1.1 `config/version.json` 新增 `updatedAt` 欄位（YYYY-MM-DD）
- [x] 1.2 新增 `components/layout/footer.tsx`（server 元件，import version.json，顯示 `v{version} · {updatedAt}`，text-xs muted 置中）
- [x] 1.3 `(user)/layout.tsx` 與 `(admin)/layout.tsx` 主內容後掛 `<Footer />`

## 2. 語言切換移位

- [x] 2.1 `components/layout/topbar.tsx` 移除 `LanguageSwitcher`（import＋JSX）
- [x] 2.2 個人資料頁（`/user/[spiritId]/profile`）於變更密碼卡與登出區之間新增「語言設定」卡片，重用 `LanguageSwitcher`；區塊標題 i18n key（zh-TW＋en）；登入頁切換器不動

## 3. 文件與版本

- [x] 3.1 三份手冊：語言切換入口改個人資料頁、新增 Footer 版本說明（有提及者更新）；檔首版本日期同步
- [x] 3.2 CLAUDE.md 第 7 點「側邊欄底部會顯示對應版本」改為 Footer＋updatedAt 維護慣例
- [x] 3.3 `config/version.json` patch +1 並更新 `updatedAt`（本變更自身）
- [x] 3.4 依 `.ai-rules.md` 更新 `README-AI.md`

## 4. 驗證

- [x] 4.1 `npm run lint` 與 `npm run build` 通過
- [ ] 4.2 手動驗證：①登入後任一頁與後台頁底部顯示 `v… · 日期`、登入頁無 Footer；②Topbar 無語言切換；③個人資料頁語言設定卡可切換三語言且保留路徑；④登入頁切換器正常
