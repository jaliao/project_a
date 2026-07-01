## 1. 資料層

- [x] 1.1 `lib/data/course-order.ts`：`CourseOrderWithInvite` / `CourseOrderForPrint` 新增 `bookItems: OrderBookItem[]`（`{ studentName; bookName; version }`）
- [x] 1.2 `getAllCourseOrdersWithInvite` / `getCourseOrderForPrint`：`shipMode === 'single' && inviteId` 時以 `getCourseBookItems` 帶入 `bookItems`

## 2. 後台表格顯示

- [x] 2.1 `material-order-table.tsx` 單一地址詳情：於書本數量下方列出書本清單（學員名（書本名字）· 繁/簡）

## 3. 列印顯示

- [x] 3.1 `admin/materials/[id]/print`：單一地址 slip `items` 帶入 `order.bookItems`（含學員名）；render 顯示學員名（書本名字）· 版本

## 4. 文件與版本

- [x] 4.1 `doc/管理者操作手冊.md`：單一地址亦顯示書本清單（詳情＋列印）；版本 v0.1.112
- [x] 4.2 `config/version.json` → 0.1.112；README-AI 同步

## 5. 驗證

- [x] 5.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）通過
- [ ] 5.2 （執行階段）單一地址訂單詳情與列印顯示書本清單（學員名＋書本名字＋版本）；無 migration
