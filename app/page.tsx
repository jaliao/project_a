import { redirect } from 'next/navigation'

// 根路徑：middleware 攔截未登入並導向 /login
// 已登入使用者導向首頁
export default function RootPage() {
  redirect('/dashboard')
}
