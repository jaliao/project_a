## 1. 安裝套件

- [x] 1.1 安裝 `xlsx`（SheetJS）套件：`npm install xlsx --legacy-peer-deps`

## 2. 資料層

- [x] 2.1 `lib/data/members.ts`：新增 `exportMembers(q?)` 函式，select 完整欄位（`spiritId`、`realName`、`englishName`、`nickname`、`email`、`commEmail`、`phone`、`gender`、`role`、`church.name`、`churchOther`、`churchType`、`learningLevel`、`createdAt`、`lastLoginAt`）

## 3. Route Handler

- [x] 3.1 新增 `app/api/admin/members/export/route.ts`
- [x] 3.2 驗證 session + admin role，非 admin 回傳 401
- [x] 3.3 讀取 `?q=` 參數，呼叫 `exportMembers(q)`
- [x] 3.4 將資料轉換為 13 欄 xlsx（中文欄位名稱、性別/角色中文化、教會欄位合併、日期格式 YYYY/MM/DD）
- [x] 3.5 回傳正確 `Content-Type` 與 `Content-Disposition: attachment; filename="members-YYYY-MM-DD.xlsx"`

## 4. 頁面調整（`app/(user)/admin/members/page.tsx`）

- [x] 4.1 表格欄位順序調整：啟動編號移至第一欄（啟動編號 → 姓名 → Email → 加入日期 → 操作）
- [x] 4.2 在搜尋列同排（右上角）新增兩個匯出按鈕：「匯出 {N} 筆」（href 帶 `?q=`）與「匯出全部」（href 無 `?q=`），以 `<a>` 標籤連結至 `/api/admin/members/export`

## 5. 版本與驗證

- [x] 5.1 `config/version.json` patch +1
- [x] 5.2 確認 `npm run build` 通過
