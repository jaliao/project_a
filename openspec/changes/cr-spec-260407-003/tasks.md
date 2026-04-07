## 1. 實作

- [x] 1.1 在 `app/(auth)/register/register-form.tsx` 新增 `successOpen` state（`useState(false)`）
- [x] 1.2 在 `onEmailSubmit` 的成功分支，將 `toast.success(...)` 替換為 `setSuccessOpen(true)`
- [x] 1.3 在表單 JSX 中加入 `<Dialog open={successOpen}>`，設定 `onOpenChange={() => {}}` 防止關閉
- [x] 1.4 Dialog 內容：標題「帳號建立成功」、說明文字「請查收 Email 完成驗證」、「返回首頁」按鈕（`useRouter().push('/')`）
- [x] 1.5 新增 `useRouter` import（`next/navigation`）及 `Dialog` 相關 import（`@/components/ui/dialog`）

## 2. 驗證

- [ ] 2.1 送出有效 Email → Dialog 出現，toast 不出現
- [ ] 2.2 點擊「返回首頁」→ 導向 `/`
- [ ] 2.3 點擊背景或按 Esc → Dialog 維持開啟
- [x] 2.4 執行 `npm run build` 確認無編譯錯誤
