## Why

Email 註冊成功後目前僅以 toast 提示，訊息短暫消失後使用者停留在註冊頁、不知道下一步該怎麼做。改以 Dialog 明確告知成功狀態並引導回首頁，提升完成感與流程清晰度。

## What Changes

- Email 註冊成功後，以 Dialog 取代 toast 通知
- Dialog 內容說明「帳號已建立，請查收 Email」
- Dialog 提供「返回首頁」按鈕，點擊後導向 `/`
- 移除原本的 `toast.success` 呼叫

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `email-registration`：Email 註冊成功的回饋方式從 toast 改為 Dialog + 返回首頁

## Impact

- `app/(auth)/register/register-form.tsx`：新增 Dialog state，成功後開啟 Dialog，移除 toast.success
