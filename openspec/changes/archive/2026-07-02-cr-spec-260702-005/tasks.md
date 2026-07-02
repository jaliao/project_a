# cr-spec-260702-005 Tasks：教材所屬姓名必填與誤植聲明

## 1. i18n 文案

- [x] 1.1 `messages/zh-TW.json`：`course.enroll.bookNameLabel` 改為「教材所屬姓名」、`bookNamePlaceholder` 改寫（去除「留空則用你的姓名」），新增 `bookNameNote`（「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」）與 `bookNameRequired`（必填提示）
- [x] 1.2 `messages/en.json`：同步更新／新增上述四個 key 的英文翻譯
- [x] 1.3 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`（不手改）

## 2. 前端 Dialog

- [x] 2.1 `components/course-session/enrollment-application-dialog.tsx`：標籤加必填星號；`handleConfirm` 在 `selected !== 'none'` 且 `bookName.trim()` 為空時 `toast.error(t('course.enroll.bookNameRequired'))` 並中止
- [x] 2.2 同檔：Input 下方新增聲明列（`text-xs text-muted-foreground`，取 `course.enroll.bookNameNote`），僅在欄位顯示（選了購買版本）時出現

## 3. 伺服端驗證

- [x] 3.1 `app/actions/course-invite.ts` `applyToCourse`：`materialChoice !== 'none'` 且姓名 trim 後為空 → 回傳 `{ success: false, message: '請填寫教材所屬姓名' }`，移除「查 user 套 `defaultBookName()`」的空白 fallback 分支（trim + `slice(0, 100)` 維持）；`lib/data/material-items.ts` 的 `defaultBookName()` 保留供頁面預帶

## 4. 文件與版號

- [x] 4.1 檢查並更新 `doc/學員手冊.md`（申請流程之欄位名、必填說明、誤植聲明），及 `doc/老師手冊.md`／`doc/管理者操作手冊.md` 中「書本名字」名詞沿用處；更新各檔檔首版本標註與日期
- [x] 4.2 `config/version.json` patch +1；依 `.ai-rules.md` 重新產生 `README-AI.md`

## 5. 驗證

- [x] 5.1 `npm run lint` 與 `npm run build` 通過
- [x] 5.2 手動驗證：選繁/簡版本顯示「教材所屬姓名」（預帶姓名）與聲明文字；清空送出被 toast 阻擋；選「無須購買」不顯示欄位；正常送出後 `materialBookName` 存所填值
