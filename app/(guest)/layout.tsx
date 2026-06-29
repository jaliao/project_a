/*
 * ----------------------------------------------
 * (guest) Layout - 免登入頁面群組
 * 2026-06-29
 * app/(guest)/layout.tsx
 *
 * 薄 passthrough：不加應用殼、不做登入守衛。
 * ⚠️ 不可盲目把已登入者導走——terms/privacy 等登入後仍須可見；
 *    需自行 auth 守衛的頁面（onboarding/change-password 等）於頁面內處理。
 * ----------------------------------------------
 */

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
