## 1. i18n 文案

- [x] 1.1 `messages/zh-TW.json` 的 `course.material` 命名空間新增 `deliveryAddressHint`: "請填寫完整地址並包含郵遞區號"
- [x] 1.2 `messages/en.json` 補上對應英文翻譯
- [x] 1.3 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 2. 元件改動

- [x] 2.1 `components/course-session/material-order-dialog.tsx` 從 `@/components/ui/form` 補匯入 `FormDescription`
- [x] 2.2 單一地址模式收件地址欄位（382-390 行）於 `<FormControl>` 與 `<FieldError>` 之間新增 `<FormDescription>{t('deliveryAddressHint')}</FormDescription>`
- [x] 2.3 多地址模式收件地址欄位（`MultiAddressRow` 內，726-731 行）同樣新增 `<FormDescription>{t('deliveryAddressHint')}</FormDescription>`

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 3.2 於瀏覽器開啟教材申請表單，切換單一地址／多地址、切換取貨方式為宅配（非超商），確認收件地址欄位下方皆顯示提示文字；新增多地址列時新地址列亦顯示提示
