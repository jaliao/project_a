# Tasks — 電話驗證支援國際號碼

## 1. Schema 驗證放寬

- [x] 1.1 `lib/schemas/profile.ts`：新增模組層常數 `PHONE_REGEX = /^(09\d{8}|\+[1-9]\d{7,14})$/`，`updateProfileSchema.phone` 與 `onboardingProfileSchema.phone` 改引用該常數

## 2. i18n 文案

- [x] 2.1 `messages/zh-TW.json`：`validation.phoneInvalid` 改「請輸入有效的手機號碼（台灣 09xxxxxxxx，或國際格式如 +12025550123）」、`profile.phonePlaceholder` 改「例：0912345678 或 +12025550123」
- [x] 2.2 `messages/en.json`：同步更新兩個 key 的英文文案
- [x] 2.3 `npm run gen:zh-cn` 重新產生簡體訊息

## 3. 驗證與收尾

- [x] 3.1 `npm run lint` 與 `npm run build` 通過
- [x] 3.2 手動驗證：onboarding Step 2 與個人資料表單輸入 `+12025550123` 可通過並儲存；`0912345678` 仍通過；`12345` 被擋且錯誤訊息為新文案
- [x] 3.3 `doc/學員手冊.md` Step 2 手機號碼加註可填國際格式（如 +1...），檔首版本與日期更新
- [x] 3.4 `config/version.json` patch +1、`updatedAt` 更新；`README-AI.md` 版本與「已完成」清單更新
