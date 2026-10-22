## 1. 修正 LINE 連結狀態顯示

- [x] 1.1 `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`：比照第 171 行 `isGoogleLinked`，新增 `const isLineLinked = linkedProviders.includes('line')`。
- [x] 1.2 同檔第 412–420 行 LINE 區塊：狀態文字改為 `{isLineLinked ? t('profile.providerLinked') : t('profile.providerUnlinked')}`，移除容易誤導的固定「未連結」寫死文字與外層 `opacity-60`（僅狀態文字正常顯示；互動按鈕維持 disabled 樣式）。
- [x] 1.3 互動按鈕維持 `disabled` 與 `t('profile.comingSoon')` 文案不變，不開放任何 OAuth 綁定／解綁觸發。

## 2. 驗證

- [x] 2.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 2.2 情境：已用 LINE 登入過的帳號開啟個人資料頁，確認「帳號連動」卡片 LINE 顯示「已連結」。（使用者實測確認無誤）
- [x] 2.3 情境：未綁 LINE 的帳號開啟個人資料頁，確認 LINE 仍顯示「未連結」；Google 區塊顯示不受影響。（使用者實測確認無誤）
- [x] 2.4 情境：兩種帳號下，LINE 按鈕皆為 disabled 且顯示「即將推出」，點擊無反應。（使用者實測確認無誤；互動綁定功能另開新 CR 處理）

## 3. 版本號

- [x] 3.1 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期。
