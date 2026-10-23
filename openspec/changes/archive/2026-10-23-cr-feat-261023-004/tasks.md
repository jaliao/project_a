## 1. 前端

- [x] 1.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`prisma.user.findUnique` select 新增 `churchType`、`churchOther`、`church: { select: { name: true } }`
- [x] 1.2 在基本資料區塊 Spirit ID 列之後、身分標籤列之前，新增「性別」列：重用 `GenderIcon`（`components/shared/gender-icon.tsx`）＋性別文字
- [x] 1.3 新增「所屬教會」列：server 端算好三態字串（教會名稱／自填文字／「未設定」）後渲染

## 2. i18n

- [x] 2.1 `messages/zh-TW.json` 的 `studentProfile` 命名空間新增：`genderLabel`（性別）、`churchLabel`（所屬教會）、`churchUnset`（未設定）、巢狀 `gender.male`（男）/`gender.female`（女）/`gender.unspecified`（未設定）
- [x] 2.2 `messages/en.json` 補對應英文翻譯
- [x] 2.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`（不手改簡體檔）

## 3. 驗證

- [ ] 3.1 手動驗證：開啟性別已填（男/女）的學員首頁，正確顯示對應圖示與文字
- [ ] 3.2 手動驗證：開啟性別未設定的學員首頁，顯示「未設定」
- [ ] 3.3 手動驗證：`churchType` 為教會／其他／無三種情形，所屬教會欄位分別正確顯示教會名稱／自填文字／「未設定」
- [ ] 3.4 手動驗證：以非本人身分開啟他人首頁，性別與所屬教會仍正確顯示（公開顯示）
- [x] 3.5 `npm run lint` 與 `npm run build` 通過

## 4. 文件同步

- [x] 4.1 依 CLAUDE.md 第 9 點，檢查並更新 `doc/學員手冊.md`（基本資料新增性別／所屬教會顯示說明）
- [x] 4.2 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期
- [x] 4.3 依 CLAUDE.md 第 8 點更新 `ai-context/` 有異動的章節檔
