# Tasks — 後台機敏資料遮蔽（cr-spec-260701-008）

## 1. 遮蔽元件

- [x] 1.1 新增 `components/admin/masked-value.tsx` client 元件：props 收 `value`（string | null | undefined）與 `label`（欄位名，供 aria-label 組字）；預設顯示固定 `***`、點擊切換明文、再點恢復；空值直接渲染 `—`（不可點）；以 `<button type="button">` 實作並附 IconEye/IconEyeOff 圖示，aria-label 依狀態切換（標頭註解、繁體文案）

## 2. 學員頁面套用

- [x] 2.1 `/admin/members` 清單（`app/[locale]/(admin)/admin/members/page.tsx`）：Email 欄改以 `<MaskedValue>` 呈現（逐筆獨立切換）
- [x] 2.2 `/admin/members/[id]` 詳情（`app/[locale]/(admin)/admin/members/[id]/page.tsx`）：基本資料 Email 改以 `<MaskedValue>` 呈現，並新增「電話」欄位（`member.phone`，同樣遮蔽；資料層已 select `phone`，免改）
- [x] 2.3 `/admin/members/inactive`（`app/[locale]/(admin)/admin/members/inactive/page.tsx`）：email 欄改以 `<MaskedValue>` 呈現

## 3. 手冊與版本

- [x] 3.1 更新 `doc/管理者操作手冊.md` 會員管理章節：補充電話/Email 預設遮蔽與點擊檢視說明，並更新檔首版本標註與日期
- [x] 3.2 `config/version.json` patch 版本 +1
- [x] 3.3 依 `.ai-rules.md` 更新 `README-AI.md`（反映版本號與本次功能）

## 4. 驗證

- [x] 4.1 `npm run lint` 與 `npm run build` 通過
- [x] 4.2 手動驗證：三頁 Email（及詳情頁電話）預設 `***`、點擊逐筆切換、空電話顯示 `—`、鍵盤 Enter/Space 可切換、Email 搜尋不受影響
